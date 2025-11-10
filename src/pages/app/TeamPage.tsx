import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { teamsService } from "@/services/teams.service";
import { usersService } from "@/services/users.service";
import { useAuthUser } from "@/stores/auth.store";
import type { CustomUser, TeamMember, Position } from "@/types";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { profilesService } from "@/services/profiles.service";

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
  const amCoachOnThisTeam = !!user && staffers.some(s => s.id === user.id && user.role === "COACH");
  const canManage =
    !!user && !!myTeam && (
      user.role === "ADMIN" ||
      myTeam.owner === user.id ||
      amCoachOnThisTeam
    );
  // Fetch function for SearchableSelect: search users not already in this team
  const fetchCandidates = async (q: string): Promise<{ value: number; label: string; sub?: string }[]> => {
  const all = await usersService.adminListAll(q || undefined);
  const memberIds = new Set([...players, ...staffers].map(m => m.id));
    return all
      .filter(u => !memberIds.has(u.id))
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
  // inside TeamPage.tsx
  function CreateMemberForm({
    teamId,
    defaultRole,
    onCreated,
  }: {
    teamId: number;
    defaultRole: "PLAYER" | "COACH" | "STAFF";
    onCreated: () => void;
  }) {
    // Lookup data
    const { data: positions = [], isLoading: posLoading } = useQuery({
      queryKey: ["positions"],
      queryFn: profilesService.listPositions,
      staleTime: 60_000,
    });
    const { data: specialties = [] } = useQuery({
      queryKey: ["specialties"],
      queryFn: profilesService.listSpecialties,
      staleTime: 60_000,
    });
    const { data: licenses = [] } = useQuery({
      queryKey: ["licenses"],
      queryFn: profilesService.listLicenses,
      staleTime: 60_000,
    });
  
    const groupedPositions = React.useMemo(() => {
      const map = new Map<Position["line"], Position[]>();
      positions.forEach(p => {
        const arr = map.get(p.line) ?? [];
        arr.push(p);
        map.set(p.line, arr);
      });
      const order: Position["line"][] = ["GK", "DF", "MF", "FW"];
      return order
        .filter(line => map.has(line))
        .map(line => [line, (map.get(line) ?? []).sort((a,b) => a.name.localeCompare(b.name))] as const);
    }, [positions]);
  
    // ---- Form state ----
    const [form, setForm] = React.useState({
      role: defaultRole as "PLAYER" | "COACH" | "STAFF",
      email: "",
      first_name: "",
      last_name: "",
      profile_picture: null as File | null,
    
      // Membership-scoped
      jersey_number: "",
      positionId: "" as string,
      squad_status: "",
    
      // PLAYER profile
      dob: "", // YYYY-MM-DD
      height_cm: "",
      weight_kg: "",
      dominant_foot: "" as "" | "left" | "right" | "both",
      preferred_positions: [] as number[], // Position.id[]
      player_bio: "",
    
      // COACH profile
      coach_dob: "",
      years_experience: "",
      coach_specialties: [] as number[], // Specialty.id[]
      coach_licenses: [] as number[],    // License.id[]
      coach_bio: "",
    
      // STAFF profile
      staff_dob: "",
      staff_type: "",
      staff_specialties: [] as number[],
      staff_certifications: [] as number[], // License.id[]
      staff_bio: "",
    });
  
    React.useEffect(() => {
      setForm((f) => ({ ...f, role: defaultRole }));
    }, [defaultRole]);
  
    const [submitting, setSubmitting] = React.useState(false);
  
    // ---- Helpers for multi-select (checkbox groups) ----
    const toggleNumInArray = (arr: number[], id: number) =>
      arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
  
    // ---- Submit ----
    const submit = async () => {
      setSubmitting(true);
      try {
        const fd = new FormData();
      
        // Core user
        fd.append("role", form.role);
        fd.append("email", form.email);
        fd.append("first_name", form.first_name);
        fd.append("last_name", form.last_name);
        if (form.profile_picture) fd.append("profile_picture", form.profile_picture);
      
        // TeamMembership extras (applied by backend after creating user)
        if (form.jersey_number) fd.append("jersey_number", String(Number(form.jersey_number)));
        if (form.positionId) fd.append("primary_position", String(Number(form.positionId)));
        if (form.squad_status) fd.append("squad_status", form.squad_status);
      
        // Role-specific profile data
        if (form.role === "PLAYER") {
          if (form.dob) fd.append("dob", form.dob);
          if (form.height_cm) fd.append("height_cm", String(Number(form.height_cm)));
          if (form.weight_kg) fd.append("weight_kg", String(Number(form.weight_kg)));
          if (form.dominant_foot) fd.append("dominant_foot", form.dominant_foot);
          if (form.player_bio) fd.append("bio", form.player_bio);
        
          // preferred_positions (array)
          // Repeat the same key (DRF accepts repeated keys as a list)
          form.preferred_positions.forEach(pid => fd.append("preferred_positions", String(pid)));
          // If your backend expects "preferred_positions[]", change the key accordingly.
        }
      
        if (form.role === "COACH") {
          if (form.coach_dob) fd.append("dob", form.coach_dob);
          if (form.years_experience) fd.append("years_experience", String(Number(form.years_experience)));
          if (form.coach_bio) fd.append("bio", form.coach_bio);
          form.coach_specialties.forEach(id => fd.append("specialties", String(id)));
          form.coach_licenses.forEach(id => fd.append("licenses", String(id)));
        }
      
        if (form.role === "STAFF") {
          if (form.staff_dob) fd.append("dob", form.staff_dob);
          if (form.staff_type) fd.append("staff_type", form.staff_type);
          if (form.staff_bio) fd.append("bio", form.staff_bio);
          form.staff_specialties.forEach(id => fd.append("specialties", String(id)));
          form.staff_certifications.forEach(id => fd.append("certifications", String(id)));
        }
      
        // 1) Create the user + attach membership
        const created = await teamsService.createMember(teamId, fd);
      
        // 2) (Optional) You already sent primary_position via fd; only call update_member if you want to update again later.
      
        onCreated();
        // reset
        setForm({
          ...form,
          email: "",
          first_name: "",
          last_name: "",
          profile_picture: null,
          jersey_number: "",
          positionId: "",
          squad_status: "",
          dob: "",
          height_cm: "",
          weight_kg: "",
          dominant_foot: "",
          preferred_positions: [],
          player_bio: "",
          coach_dob: "",
          years_experience: "",
          coach_specialties: [],
          coach_licenses: [],
          coach_bio: "",
          staff_dob: "",
          staff_type: "",
          staff_specialties: [],
          staff_certifications: [],
          staff_bio: "",
        });
      } finally {
        setSubmitting(false);
      }
    };
  
    // ---- UI ----
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
            className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
        </div>
    
        {/* Membership fields */}
        <div>
          <label className="text-sm">Primary position</label>
          <select
            className="mt-1 block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            value={form.positionId}
            onChange={(e) => setForm((f) => ({ ...f, positionId: e.target.value }))}
            disabled={posLoading}
          >
            <option value="">Select…</option>
            {groupedPositions.map(([line, list]) => (
              <optgroup key={line} label={line}>
                {list.map(pos => (
                  <option key={pos.id} value={String(pos.id)}>
                    {pos.name}
                  </option>
                ))}
              </optgroup>
            ))}
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
          
        <div className="sm:col-span-2">
          <label className="text-sm">Squad status (optional)</label>
          <input
            className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
            placeholder="e.g., First Team, U23, Loan, Trialist"
            value={form.squad_status}
            onChange={(e) => setForm((f) => ({ ...f, squad_status: e.target.value }))}
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
          
        {/* =============== PLAYER FIELDS =============== */}
        {form.role === "PLAYER" && (
          <>
            <div>
              <label className="text-sm">Date of birth</label>
              <input
                type="date"
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
              />
            </div>
        
            <div>
              <label className="text-sm">Height (cm)</label>
              <input
                type="number"
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                value={form.height_cm}
                onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
              />
            </div>
        
            <div>
              <label className="text-sm">Weight (kg)</label>
              <input
                type="number"
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                value={form.weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
              />
            </div>
        
            <div>
              <label className="text-sm">Dominant foot</label>
              <select
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                value={form.dominant_foot}
                onChange={(e) => setForm((f) => ({ ...f, dominant_foot: e.target.value as any }))}
              >
                <option value="">Select…</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="both">Both</option>
              </select>
            </div>
        
            {/* Preferred positions (multi-select checkboxes) */}
            <div className="sm:col-span-2">
              <label className="text-sm">Preferred positions</label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                {groupedPositions.map(([line, list]) => (
                  <div key={line}>
                    <div className="text-xs uppercase text-gray-500 mb-1">{line}</div>
                    <div className="space-y-1">
                      {list.map(p => (
                        <label key={p.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.preferred_positions.includes(p.id)}
                            onChange={() =>
                              setForm(f => ({
                                ...f,
                                preferred_positions: toggleNumInArray(f.preferred_positions, p.id),
                              }))
                            }
                          />
                          <span>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
              
            <div className="sm:col-span-2">
              <label className="text-sm">Bio</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={4}
                value={form.player_bio}
                onChange={(e) => setForm((f) => ({ ...f, player_bio: e.target.value }))}
              />
            </div>
          </>
        )}
  
        {/* =============== COACH FIELDS =============== */}
        {form.role === "COACH" && (
          <>
            <div>
              <label className="text-sm">Date of birth</label>
              <input
                type="date"
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                value={form.coach_dob}
                onChange={(e) => setForm((f) => ({ ...f, coach_dob: e.target.value }))}
              />
            </div>
        
            <div>
              <label className="text-sm">Years of experience</label>
              <input
                type="number"
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                value={form.years_experience}
                onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))}
              />
            </div>
        
            <div className="sm:col-span-2">
              <label className="text-sm">Specialties</label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {specialties.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.coach_specialties.includes(s.id)}
                      onChange={() =>
                        setForm(f => ({
                          ...f,
                          coach_specialties: toggleNumInArray(f.coach_specialties, s.id),
                        }))
                      }
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
              
            <div className="sm:col-span-2">
              <label className="text-sm">Licenses</label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {licenses.map(l => (
                  <label key={l.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.coach_licenses.includes(l.id)}
                      onChange={() =>
                        setForm(f => ({
                          ...f,
                          coach_licenses: toggleNumInArray(f.coach_licenses, l.id),
                        }))
                      }
                    />
                    <span>{l.name}{l.issuer ? ` (${l.issuer})` : ""}</span>
                  </label>
                ))}
              </div>
            </div>
              
            <div className="sm:col-span-2">
              <label className="text-sm">Bio</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={4}
                value={form.coach_bio}
                onChange={(e) => setForm((f) => ({ ...f, coach_bio: e.target.value }))}
              />
            </div>
          </>
        )}
  
        {/* =============== STAFF FIELDS =============== */}
        {form.role === "STAFF" && (
          <>
            <div>
              <label className="text-sm">Date of birth</label>
              <input
                type="date"
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                value={form.staff_dob}
                onChange={(e) => setForm((f) => ({ ...f, staff_dob: e.target.value }))}
              />
            </div>
        
            <div>
              <label className="text-sm">Staff type</label>
              <input
                className="mt-1 block w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                placeholder="e.g., Physio, Analyst, Doctor"
                value={form.staff_type}
                onChange={(e) => setForm((f) => ({ ...f, staff_type: e.target.value }))}
              />
            </div>
        
            <div className="sm:col-span-2">
              <label className="text-sm">Specialties</label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {specialties.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.staff_specialties.includes(s.id)}
                      onChange={() =>
                        setForm(f => ({
                          ...f,
                          staff_specialties: toggleNumInArray(f.staff_specialties, s.id),
                        }))
                      }
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
              
            <div className="sm:col-span-2">
              <label className="text-sm">Certifications (licenses)</label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {licenses.map(l => (
                  <label key={l.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.staff_certifications.includes(l.id)}
                      onChange={() =>
                        setForm(f => ({
                          ...f,
                          staff_certifications: toggleNumInArray(f.staff_certifications, l.id),
                        }))
                      }
                    />
                    <span>{l.name}{l.issuer ? ` (${l.issuer})` : ""}</span>
                  </label>
                ))}
              </div>
            </div>
              
            <div className="sm:col-span-2">
              <label className="text-sm">Bio</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={4}
                value={form.staff_bio}
                onChange={(e) => setForm((f) => ({ ...f, staff_bio: e.target.value }))}
              />
            </div>
          </>
        )}
  
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
      {/*
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
      */}
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
