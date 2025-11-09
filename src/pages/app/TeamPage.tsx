import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { teamsService } from "@/services/teams.service";
import { usersService } from "@/services/users.service";
import { useAuthUser } from "@/stores/auth.store";
import type { CustomUser, TeamMember } from "@/types";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

export default function TeamPage() {
  const qc = useQueryClient();
  const user = useAuthUser();

  // Canonical team (member or owner)
  const { data: myTeam } = useQuery({ queryKey: ["my-team"], queryFn: teamsService.myTeam });

  const teamId = myTeam?.id ?? null;

  // squad
  const { data: squad } = useQuery({
    enabled: !!teamId,
    queryKey: ["team", teamId, "squad"],
    queryFn: () => teamsService.getSquad(teamId!),
    staleTime: 60_000,              // 1 min fresh
    refetchOnWindowFocus: false,    // don't refetch on focus
    refetchOnMount: false,          // reuse cached if fresh
  });
  
  // staff
  const { data: staff } = useQuery({
    enabled: !!teamId,
    queryKey: ["team", teamId, "staff"],
    queryFn: () => teamsService.getStaff(teamId!),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });


  const players: TeamMember[] = squad?.players ?? [];
  const staffers: TeamMember[] = staff?.staff ?? [];

  // Permission to add members: admin OR (owner of team) OR (coach of this team)
  const canManage =
    !!user &&
    !!myTeam &&
    (user.role === "ADMIN" ||
      myTeam.owner === user.id ||
      (user.role === "COACH" && user.team === myTeam.id));

  // Fetch function for SearchableSelect: search users not already in this team
  const fetchCandidates = async (q: string): Promise<{ value: number; label: string; sub?: string }[]> => {
    const all = await usersService.adminListAll(q || undefined);
    return all
      .filter(u => u.team !== myTeam?.id) // exclude already in this team
      .filter(u => u.role === 'PLAYER')
      .map(u => ({
        value: u.id,
        label: `${u.first_name} ${u.last_name}`,
        sub: `${u.email} • ${u.role}${u.team_name ? ` • ${u.team_name}` : ""}`,
      }));
  };

  const addMutation = useMutation({
    mutationFn: async (p: { user_id: number; role: "PLAYER" | "STAFF" | "COACH" }) => {
      if (!teamId) throw new Error("No team id");
      return teamsService.addMember(teamId, p);
    },
    onSuccess: () => {
      // refresh squad & staff
      if (teamId) {
        qc.invalidateQueries({ queryKey: ["team", teamId, "squad"] });
        qc.invalidateQueries({ queryKey: ["team", teamId, "staff"] });
      }
    },
  });

  // UI state
  const [selecting, setSelecting] = React.useState<null | "PLAYER" | "STAFF">(null);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);

  // Group players by position
  const groupedPlayers = React.useMemo(() => {
    const map = new Map<string, typeof players>();
    players.forEach((p) => {
      const key = p.position ?? "Unknown";
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [players]);
  function CreateMemberForm({
    teamId,
    defaultRole,
    onCreated,
  }: {
    teamId: number;
    defaultRole: "PLAYER" | "COACH" | "STAFF";
    onCreated: () => void;
  }) {
    const [form, setForm] = React.useState({
      role: defaultRole,
      email: "",
      first_name: "",
      last_name: "",
      date_of_birth: "",
      jersey_number: "",
      position: "" as "" | "GK" | "DF" | "MF" | "FW",
      profile_picture: null as File | null,
    });
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
      setForm((f) => ({ ...f, role: defaultRole }));
    }, [defaultRole]);

    const submit = async () => {
      setSubmitting(true);
      try {
        const fd = new FormData();
        fd.append("role", form.role);
        fd.append("email", form.email);
        fd.append("first_name", form.first_name);
        fd.append("last_name", form.last_name);
        if (form.date_of_birth) fd.append("date_of_birth", form.date_of_birth);
        if (form.jersey_number) fd.append("jersey_number", String(Number(form.jersey_number)));
        if (form.position) fd.append("position", form.position);
        if (form.profile_picture) fd.append("profile_picture", form.profile_picture);

        await teamsService.createMember(teamId, fd);
        onCreated();
        setForm({
          role: defaultRole,
          email: "",
          first_name: "",
          last_name: "",
          date_of_birth: "",
          jersey_number: "",
          position: "",
          profile_picture: null,
        });
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Role */}
        <div>
          <label className="text-sm">Role</label>
          <select
            className="mt-1 block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}
          >
            <option>PLAYER</option>
            <option>COACH</option>
            <option>STAFF</option>
          </select>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm">Email</label>
          <input
            className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        {/* First/Last */}
        <div>
          <label className="text-sm">First name</label>
          <input
            className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm">Last name</label>
          <input
            className="mt1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
        </div>

        {/* Football profile */}
        <div>
          <label className="text-sm">Position</label>
          <select
            className="mt-1 block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value as any }))}
          >
            <option value="">Select…</option>
            <option value="GK">Goalkeeper</option>
            <option value="DF">Defender</option>
            <option value="MF">Midfielder</option>
            <option value="FW">Forward</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Jersey number</label>
          <input
            className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
            value={form.jersey_number}
            onChange={(e) => setForm((f) => ({ ...f, jersey_number: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm">Date of birth</label>
          <input
            type="date"
            className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
            value={form.date_of_birth}
            onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm">Profile picture</label>
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm"
            onChange={(e) => setForm((f) => ({ ...f, profile_picture: e.target.files?.[0] ?? null }))}
          />
        </div>

        <div className="sm:col-span-2 mt-2">
          <Button disabled={submitting} onClick={submit}>
            {submitting ? "Creating…" : "Create member"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Page title="My Team" subtitle={myTeam?.name ?? "—"}>
      <div className="mb-4 flex gap-2">
        {canManage && (
          <>
            <Button onClick={() => { setSelecting("PLAYER"); setSelectedUserId(null); }}>
              Add Player
            </Button>
            <Button variant="secondary" onClick={() => { setSelecting("STAFF"); setSelectedUserId(null); }}>
              Add Staff
            </Button>
          </>
        )}
      </div>

      {/* Create-only management */}
      {canManage && (
        <Card className="mb-6">
          <div className="flex items-center gap-2 border-b border-gray-200 px-2">
            <button
              className={`px-3 py-2 text-sm font-medium ${selecting === "PLAYER" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500"}`}
              onClick={() => setSelecting("PLAYER")}
              title="Create Player"
            >
              Player
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${selecting === "STAFF" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500"}`}
              onClick={() => setSelecting("STAFF")}
              title="Create Staff/Coach"
            >
              Staff / Coach
            </button>
          </div>
      
          <div className="p-4">
            <CreateMemberForm
              teamId={teamId!}
              defaultRole={selecting ?? "PLAYER"}
              onCreated={() => {
                qc.invalidateQueries({ queryKey: ["team", teamId, "squad"] });
                qc.invalidateQueries({ queryKey: ["team", teamId, "staff"] });
              }}
            />
            <p className="mt-2 text-xs text-gray-500">
              You can remove a member from the lists below. Adding existing users is disabled for this team.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Squad</h2>
          {groupedPlayers.length ? (
            <div className="space-y-6">
              {groupedPlayers.map(([pos, list]) => (
                <div key={pos}>
                  <div className="text-xs uppercase text-gray-500 mb-2">{pos}</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {list.map((p) => (
                      <div key={p.id} className="rounded-lg border p-3 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center">
                          {p.profile_picture ? (
                            <img src={p.profile_picture} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-600 font-semibold">
                              {p.first_name[0] ?? "?"}{p.last_name[0] ?? ""}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{p.first_name} {p.last_name}</div>
                          <div className="text-xs text-gray-500">
                            #{p.jersey_number ?? "—"} • {p.position ?? "—"}
                          </div>
                        </div>
                        {canManage && (
                          <Button
                            variant="ghost"
                            onClick={() =>
                              teamId && teamsService
                                .removeMember(teamId, { user_id: p.id })
                                .then(() => {
                                  // refresh
                                  if (teamId) {
                                    qc.invalidateQueries({ queryKey: ["team", teamId, "squad"] });
                                    qc.invalidateQueries({ queryKey: ["team", teamId, "staff"] });
                                  }
                                })
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No players.</div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-3">Staff</h2>
          <div className="space-y-2">
            {staffers.length ? staffers.map((s) => (
              <div key={s.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{s.first_name} {s.last_name}</div>
                  <div className="text-xs text-gray-500">{s.role}</div>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      teamId && teamsService
                        .removeMember(teamId, { user_id: s.id })
                        .then(() => {
                          if (teamId) {
                            qc.invalidateQueries({ queryKey: ["team", teamId, "squad"] });
                            qc.invalidateQueries({ queryKey: ["team", teamId, "staff"] });
                          }
                        })
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
            )) : <div className="text-sm text-gray-500">No staff.</div>}
          </div>
        </Card>
      </div>
    </Page>
  );
}
