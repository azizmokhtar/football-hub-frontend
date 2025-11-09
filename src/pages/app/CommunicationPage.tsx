// src/pages/app/CommunicationPage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { communicationService } from "@/services/communication.service";
import { teamsService } from "@/services/teams.service";
import type { Conversation, TeamMember } from "@/types";
import { format } from "date-fns";
import { useAuthUser, useAuth } from "@/stores/auth.store";

export default function CommunicationPage() {
  const me = useAuthUser();
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  // -----------------------------
  // Active conversation state
  // -----------------------------
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const isGroup = activeConv?.is_group_chat;

  // -----------------------------
  // Conversations & Announcements (quiet queries)
  // -----------------------------
  const { data: conversations } = useQuery({
    enabled: !!accessToken,
    queryKey: ["conversations"],
    queryFn: communicationService.listConversations,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: announcements } = useQuery({
    enabled: !!accessToken,
    queryKey: ["announcements"],
    queryFn: communicationService.listAnnouncements,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annUrgent, setAnnUrgent] = useState(false);
  const canPostAnnouncements = !!me && ["STAFF", "COACH", "ADMIN"].includes(me.role);
  const hasTeam = !!me?.team;

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      if (!me?.team) throw new Error("You must belong to a team to post announcements.");
      return communicationService.createAnnouncement({
        title: annTitle.trim(),
        content: annBody.trim(),
        is_urgent: annUrgent,
        team: me.team, // backend will override to my team anyway; harmless
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setAnnTitle("");
      setAnnBody("");
      setAnnUrgent(false);
    },
  });
  // -----------------------------
  // Messages for the active conversation (quiet)
  // -----------------------------
  const { data: messages } = useQuery({
    enabled: !!activeConv?.id && !!accessToken,
    queryKey: ["messages", activeConv?.id],
    queryFn: () => communicationService.listMessages(activeConv!.id),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    keepPreviousData: true,
  });

  // Auto-select first conversation when list loads
  useEffect(() => {
    if (!activeConv && conversations?.length) {
      setActiveConv(conversations[0]);
    }
  }, [conversations, activeConv]);

  // -----------------------------
  // Compose / send message
  // -----------------------------
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: send, isPending: sending } = useMutation({
    mutationFn: (payload: { conversationId: number; content: string }) =>
      communicationService.sendMessage(payload.conversationId, payload.content),
    onSuccess: () => {
      if (activeConv?.id) qc.invalidateQueries({ queryKey: ["messages", activeConv.id] });
      setDraft("");
      inputRef.current?.focus();
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv?.id || !draft.trim()) return;
    send({ conversationId: activeConv.id, content: draft.trim() });
  };

  // -----------------------------
  // Team-mates fetcher for DM / Group / Add participants
  //   (reads both squad + staff; filters by search; excludes me)
  // -----------------------------
  const teamId = me?.team ?? null;

  const fetchTeammates = useCallback(
    async (q: string) => {
      if (!teamId) return [];
      const [squad, staff] = await Promise.allSettled([
        teamsService.getSquad(teamId),
        teamsService.getStaff(teamId),
      ]);

      const list: TeamMember[] = [
        ...(squad.status === "fulfilled" ? squad.value.players : []),
        ...(staff.status === "fulfilled" ? staff.value.staff : []),
      ];

      const needle = q.trim().toLowerCase();
      const filtered = needle
        ? list.filter(
            (u) =>
              u.first_name.toLowerCase().includes(needle) ||
              u.last_name.toLowerCase().includes(needle) ||
              String(u.id).includes(needle) ||
              (u as any)?.email?.toLowerCase?.()?.includes?.(needle)
          )
        : list;

      return filtered
        .filter((u) => u.id !== me?.id)
        .map((u) => ({
          value: u.id,
          label: `${u.first_name} ${u.last_name}`,
          sub: (u as any)?.email ?? "",
        }));
    },
    [teamId, me?.id]
  );

  // -----------------------------
  // Start Direct Message
  // -----------------------------
  const [dmTarget, setDmTarget] = useState<number | null>(null);
  const startDM = useMutation({
    mutationFn: (userId: number) => communicationService.startDM(userId),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConv(conv);
      setDmTarget(null);
    },
  });

  // -----------------------------
  // Create Group
  // -----------------------------
  const [groupTargets, setGroupTargets] = useState<number[]>([]);
  const [groupName, setGroupName] = useState("");

  const startGroup = useMutation({
    mutationFn: async () => {
      const payload = {
        name: groupName || null,
        is_group_chat: true,
        participants: groupTargets, // backend will include me if missing
      };
      return communicationService.createConversation(payload as any);
    },
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConv(conv);
      setGroupTargets([]);
      setGroupName("");
    },
  });

  // -----------------------------
  // Add participant to existing group
  // -----------------------------
  const [addTarget, setAddTarget] = useState<number | null>(null);
  const addToGroup = useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: number; userId: number }) =>
      communicationService.addParticipants(conversationId, [userId]),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConv(conv);
      setAddTarget(null);
    },
  });

  return (
    <Page title="Messages" subtitle="Team chats & announcements">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick actions: Start DM / Create Group */}
        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-end gap-6">
            {/* Start DM */}
            <div className="flex items-end gap-2">
              <div className="w-64">
                <div className="text-xs text-gray-500 mb-1">Start a direct message</div>
                <SearchableSelect
                  value={dmTarget}
                  onChange={(v) => setDmTarget(v ? Number(v) : null)}
                  fetchOptions={fetchTeammates}
                  placeholder="Pick teammate…"
                />
              </div>
              <Button
                disabled={!dmTarget || startDM.isPending}
                onClick={() => dmTarget && startDM.mutate(dmTarget)}
              >
                Start
              </Button>
            </div>

            {/* Create Group */}
            <div className="flex items-end gap-2">
              <div className="w-60">
                <div className="text-xs text-gray-500 mb-1">Group name (optional)</div>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Coaches"
                />
              </div>
              <div className="w-72">
                <div className="text-xs text-gray-500 mb-1">Add teammates (tap to toggle)</div>
                <SearchableSelect
                  value={null}
                  onChange={(v) => {
                    const id = Number(v);
                    setGroupTargets((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
                  }}
                  fetchOptions={fetchTeammates}
                  placeholder={groupTargets.length ? `${groupTargets.length} selected` : "Select teammates…"}
                  headLabel="Click items to toggle selection"
                />
              </div>
              <Button
                variant="secondary"
                disabled={groupTargets.length < 2 || startGroup.isPending}
                onClick={() => startGroup.mutate()}
              >
                Create group
              </Button>
            </div>
          </div>
        </Card>

        {/* Conversations */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Conversations</h2>
          </div>
          <div className="divide-y">
            {conversations?.length ? (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className={`w-full text-left py-3 px-2 rounded hover:bg-gray-50 ${
                    activeConv?.id === c.id ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="font-medium">
                    {c.name ?? (c.is_group_chat ? "Group chat" : "Direct message")}
                  </div>
                  {c.last_message ? (
                    <div className="text-xs text-gray-500">
                      {c.last_message.sender_name}: {c.last_message.content.slice(0, 60)}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">No messages yet</div>
                  )}
                </button>
              ))
            ) : (
              <div className="py-8 text-sm text-gray-500">No conversations.</div>
            )}
          </div>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2">
          {activeConv ? (
            <div className="flex flex-col h-[520px]">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Conversation</div>
                  <h3 className="text-lg font-semibold">
                    {activeConv.name ?? (activeConv.is_group_chat ? "Group chat" : "Direct message")}
                  </h3>
                </div>

                {/* Add participant to group */}
                {isGroup && (
                  <div className="flex items-end gap-2">
                    <div className="w-64">
                      <div className="text-xs text-gray-500 mb-1">Add participant</div>
                      <SearchableSelect
                        value={addTarget}
                        onChange={(v) => setAddTarget(v ? Number(v) : null)}
                        fetchOptions={fetchTeammates}
                        placeholder="Pick teammate…"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      disabled={!addTarget || addToGroup.isPending}
                      onClick={() =>
                        addTarget &&
                        activeConv &&
                        addToGroup.mutate({ conversationId: activeConv.id, userId: addTarget })
                      }
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto rounded border bg-gray-50 p-3 space-y-3">
                {messages?.length ? (
                  messages.map((m) => (
                    <div key={m.id} className="max-w-[80%]">
                      <div className="text-xs text-gray-500">
                        {m.sender_name} • {format(new Date(m.timestamp), "dd MMM HH:mm")}
                      </div>
                      <div className="bg-white rounded-md border p-2 text-sm">{m.content}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No messages.</div>
                )}
              </div>

              <form onSubmit={onSubmit} className="mt-3 flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button disabled={sending || !draft.trim()} type="submit">
                  Send
                </Button>
              </form>
            </div>
          ) : (
            <div className="py-10 text-sm text-gray-500">Select a conversation.</div>
          )}
        </Card>

        {/* Announcements */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Team announcements</h2>
            <a className="text-sm text-blue-600 hover:underline" href="/app/dashboard">
              Go to Dashboard
            </a>
            {canPostAnnouncements && (
              <Card className="lg:col-span-3">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="text-lg font-semibold">Create announcement</div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <Input
                        placeholder="e.g., Training moved to 18:30"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Content</label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                        rows={5}
                        placeholder="Share details, location changes, expectations…"
                        value={annBody}
                        onChange={(e) => setAnnBody(e.target.value)}
                      />
                    </div>

                    {/* Urgency + Submit */}
                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={annUrgent}
                          onChange={(e) => setAnnUrgent(e.target.checked)}
                        />
                        Mark as urgent
                      </label>

                      <Button
                        onClick={() => createAnnouncement.mutate()}
                        disabled={
                          createAnnouncement.isPending ||
                          !annTitle.trim() ||
                          !annBody.trim() ||
                          !hasTeam
                        }
                      >
                        {createAnnouncement.isPending ? "Posting…" : "Post announcement"}
                      </Button>
                    </div>
                      
                    {/* Error hint */}
                    {createAnnouncement.isError && (
                      <div className="text-sm text-red-600">
                        {(createAnnouncement.error as any)?.response?.data?.detail ??
                          (createAnnouncement.error as Error).message ??
                          "Failed to post announcement."}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {announcements?.length ? (
              announcements.map((a) => (
                <div key={a.id} className="rounded-lg border p-3 bg-white">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{format(new Date(a.timestamp), "dd MMM HH:mm")}</span>
                    <span>•</span>
                    <span>{a.team_name}</span>
                    <span>•</span>
                    <span>
                      by <span className="font-medium">{a.sender_name ?? "System"}</span>
                    </span>
                    {a.is_urgent && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">
                          URGENT
                        </span>
                      </>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-700 line-clamp-3">{a.content}</p>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No announcements.</div>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}
