import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { communicationService } from "@/services/communication.service";
import type { Conversation, Message } from "@/types";
import { format } from "date-fns";
import { useAuthUser } from "@/stores/auth.store";

export default function CommunicationPage() {
  const user = useAuthUser();
  const qc = useQueryClient();

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: communicationService.listConversations,
  });

  const [activeConv, setActiveConv] = useState<Conversation | null>(null);

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: communicationService.listAnnouncements,
  });

  const { data: messages } = useQuery({
    enabled: !!activeConv?.id,
    queryKey: ["messages", activeConv?.id],
    queryFn: () => communicationService.listMessages(activeConv!.id),
  });

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

  // Auto-select first conversation
  useEffect(() => {
    if (!activeConv && conversations?.length) {
      setActiveConv(conversations[0]);
    }
  }, [conversations, activeConv]);

  return (
    <Page title="Messages" subtitle="Team chats & announcements">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Conversations</h2>
            {/* You can add a “New conversation” flow later */}
          </div>
          <div className="divide-y">
            {conversations?.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConv(c)}
                className={`w-full text-left py-3 px-2 rounded hover:bg-gray-50 ${
                  activeConv?.id === c.id ? "bg-gray-50" : ""
                }`}
              >
                <div className="font-medium">{c.name ?? (c.is_group_chat ? "Group chat" : "Direct message")}</div>
                {c.last_message ? (
                  <div className="text-xs text-gray-500">
                    {c.last_message.sender_name}: {c.last_message.content.slice(0, 60)}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">No messages yet</div>
                )}
              </button>
            )) ?? <div className="py-8 text-sm text-gray-500">No conversations.</div>}
          </div>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2">
          {activeConv ? (
            <div className="flex flex-col h-[520px]">
              <div className="mb-2">
                <div className="text-sm text-gray-500">Conversation</div>
                <h3 className="text-lg font-semibold">
                  {activeConv.name ?? (activeConv.is_group_chat ? "Group chat" : "Direct message")}
                </h3>
              </div>

              <div className="flex-1 overflow-auto rounded border bg-gray-50 p-3 space-y-3">
                {messages?.map((m) => (
                  <div key={m.id} className="max-w-[80%]">
                    <div className="text-xs text-gray-500">
                      {m.sender_name} • {format(new Date(m.timestamp), "dd MMM HH:mm")}
                    </div>
                    <div className="bg-white rounded-md border p-2 text-sm">{m.content}</div>
                  </div>
                )) ?? <div className="text-sm text-gray-500">No messages.</div>}
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

        {/* Announcements (read-only list here) */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Team announcements</h2>
            <a className="text-sm text-blue-600 hover:underline" href="/app/dashboard">Go to Dashboard</a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {announcements?.map((a) => (
              <div key={a.id} className="rounded-lg border p-3 bg-white">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(a.timestamp), "dd MMM HH:mm")} • {a.team_name}
                </div>
                <p className="mt-1 text-sm text-gray-700 line-clamp-3">{a.content}</p>
              </div>
            )) ?? <div className="text-sm text-gray-500">No announcements.</div>}
          </div>
        </Card>
      </div>
    </Page>
  );
}
