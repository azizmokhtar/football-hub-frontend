import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import FieldError from "@/components/FieldError";
import { teamsService } from "@/services/teams.service";
import { usersService } from "@/services/users.service";
import type { Team, CustomUser } from "@/types";
import { normalizeApiErrors, type ApiErrors } from "@/utils/api-errors";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

export default function AdminTeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => teamsService.get(teamId),
    enabled: Number.isFinite(teamId),
  });

  const [form, setForm] = useState<Partial<Team>>({});
  const [errors, setErrors] = useState<ApiErrors>({});

  useEffect(() => {
    if (team) {
      setForm({
        name: team.name,
        location: team.location,
        established_date: team.established_date,
        head_coach: team.head_coach,
        owner: team.owner,
      });
    }
  }, [team]);

  // Search providers for owner and coach (use backend list endpoint with role filter)
  const fetchOwnerOptions = useCallback(async (q: string) => {
    const list = await usersService.adminListAllWithRole(q || undefined, ["STAFF","ADMIN"]);
    return list.map(u => ({
      value: u.id,
      label: `${u.first_name} ${u.last_name}`.trim() || u.email,
      sub: `${u.email} • ${u.role}${u.team_name ? ` • ${u.team_name}` : ""}`,
    }));
  }, []);

  const fetchCoachOptions = useCallback(async (q: string) => {
    const list = await usersService.adminListAllWithRole(q || undefined, ["COACH"]);
    return list.map(u => ({
      value: u.id,
      label: `${u.first_name} ${u.last_name}`.trim() || u.email,
      sub: `${u.email} • ${u.role}${u.team_name ? ` • ${u.team_name}` : ""}`,
    }));
  }, []);

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const patch: Partial<Team> = {
        name: form.name,
        location: form.location ?? null,
        established_date: form.established_date ?? null,
        head_coach: form.head_coach ?? null,
        owner: form.owner ?? null,
      };
      return teamsService.update(teamId, patch);
    },
    onSuccess: async () => {
      setErrors({});
      await qc.invalidateQueries({ queryKey: ["team", teamId] });
      nav(`/app/admin/teams`); // or stay on the page if you prefer
    },
    onError: (err: any) => setErrors(normalizeApiErrors(err?.response?.data ?? err)),
  });

  // (Optional) preview sections for Squad/Staff
  const { data: squad } = useQuery({
    queryKey: ["team-squad", teamId],
    queryFn: () => teamsService.getSquad(teamId),
    enabled: Number.isFinite(teamId),
  });
  const { data: staff } = useQuery({
    queryKey: ["team-staff", teamId],
    queryFn: () => teamsService.getStaff(teamId),
    enabled: Number.isFinite(teamId),
  });

  if (isLoading || !team) {
    return (
      <Page title="Team" subtitle="Loading…">
        <Card><div className="py-8 text-sm text-gray-500">Loading…</div></Card>
      </Page>
    );
  }

  return (
    <Page title={team.name} subtitle={`ID #${team.id}`}>
      <Card className="space-y-6">
        <FieldError messages={errors["detail"] || errors["non_field_errors"]} />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name ?? ""}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <FieldError messages={errors["name"]} />
          </div>

          <div>
            <Label htmlFor="loc">Location</Label>
            <Input
              id="loc"
              value={form.location ?? ""}
              onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
            />
            <FieldError messages={errors["location"]} />
          </div>

          <div>
            <Label htmlFor="est">Established (YYYY-MM-DD)</Label>
            <Input
              id="est"
              placeholder="YYYY-MM-DD"
              value={form.established_date ?? ""}
              onChange={(e) => setForm(f => ({ ...f, established_date: e.target.value }))}
            />
            <FieldError messages={errors["established_date"]} />
          </div>

          {/* Head Coach */}
          <div>
            <Label>Head Coach</Label>
            <SearchableSelect
              value={form.head_coach ?? null}
              onChange={(v) => setForm(f => ({ ...f, head_coach: (v ? Number(v) : null) }))}
              fetchOptions={fetchCoachOptions}
              placeholder={team.head_coach_name || "Select a coach…"}
              headLabel="Filter by name or email"
            />
            <FieldError messages={errors["head_coach"]} />
          </div>

          {/* Owner */}
          <div>
            <Label>Owner</Label>
            <SearchableSelect
              value={form.owner ?? null}
              onChange={(v) => setForm(f => ({ ...f, owner: (v ? Number(v) : null) }))}
              fetchOptions={fetchOwnerOptions}
              placeholder={team.owner_name || "Select an owner…"}
              headLabel="Filter by name or email"
            />
            <FieldError messages={errors["owner"]} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button disabled={isPending} onClick={() => save()}>Save changes</Button>
          <Button variant="secondary" onClick={() => nav(-1)}>Cancel</Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card>
          <div className="font-semibold mb-2">Squad (Players)</div>
          {squad?.players?.length ? (
            <ul className="text-sm space-y-1">
              {squad.players.map(p => (
                <li key={p.id}>
                  {p.first_name} {p.last_name} • {p.position ?? "—"} {p.jersey_number ? `#${p.jersey_number}` : ""}
                </li>
              ))}
            </ul>
          ) : <div className="text-sm text-gray-500">No players yet.</div>}
        </Card>

        <Card>
          <div className="font-semibold mb-2">Staff</div>
          {staff?.staff?.length ? (
            <ul className="text-sm space-y-1">
              {staff.staff.map(s => (
                <li key={s.id}>
                  {s.first_name} {s.last_name} • {s.role}
                </li>
              ))}
            </ul>
          ) : <div className="text-sm text-gray-500">No staff yet.</div>}
        </Card>
      </div>
    </Page>
  );
}
