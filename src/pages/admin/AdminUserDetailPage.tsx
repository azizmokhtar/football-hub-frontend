// src/pages/admin/AdminUserDetailPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import FieldError from "@/components/FieldError";
import { usersService } from "@/services/users.service";
import { teamsService } from "@/services/teams.service";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

import { normalizeApiErrors, type ApiErrors } from "@/utils/api-errors";
import type { CustomUser, Team, UserPosition, UserRole } from "@/types";

const ROLE_OPTIONS: UserRole[] = ["PLAYER", "COACH", "STAFF", "ADMIN"];
const POSITIONS: (UserPosition | "")[] = ["", "GK", "DF", "MF", "FW"];

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const nav = useNavigate();

  // Fetch user
  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => usersService.getUser(userId),
    enabled: Number.isFinite(userId),
  });

  // Fetch teams (for dropdown)
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams-all"],
    queryFn: () => teamsService.listAll(),
  });

  const [form, setForm] = useState<Partial<CustomUser> & {
    team?: number | null;
    date_of_birth?: string | null;
  }>({});

  const [errors, setErrors] = useState<ApiErrors>({});

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email, // read-only in UI
        role: user.role,
        team: user.team ?? null,
        date_of_birth: user.date_of_birth,
        jersey_number: user.jersey_number,
        position: user.position,
        profile_picture: user.profile_picture,
      });
    }
  }, [user]);

  // --- Searchable Team Dropdown state ---
  // no local open/query state needed anymore

  const selectedTeam = useMemo(
    () => teams.find(t => t.id === (form.team ?? undefined)) ?? null,
    [teams, form.team]
  );

  // Adapter the SearchableSelect expects: async (q) => Option[]
  const fetchTeamOptions = React.useCallback(async (q: string) => {
    // We already have all teams from React Query; filter locally.
    const needle = q.trim().toLowerCase();
    const list = !needle
      ? teams
      : teams.filter(t =>
          t.name.toLowerCase().includes(needle) ||
          String(t.id).includes(needle) ||
          (t.location ?? "").toLowerCase().includes(needle)
        );

    return list.map(t => ({
      value: t.id,
      label: t.name,
      sub: `ID ${t.id}${t.location ? ` • ${t.location}` : ""}`,
    }));
  }, [teams]);



  // Save
  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const patch: Partial<CustomUser> & { team?: number | null } = {
        first_name: form.first_name ?? "",
        last_name: form.last_name ?? "",
        role: form.role as UserRole,
        team: form.team ?? null, // writable for admin (see backend note below)
        date_of_birth: form.date_of_birth ?? null,
        jersey_number: form.role === "PLAYER" ? (form.jersey_number ?? null) : null,
        position: form.role === "PLAYER" ? ((form.position as any) ?? null) : null,
      };
      return usersService.updateUser(userId, patch);
    },
    onSuccess: () => {
      setErrors({});
      nav("/app/admin/users");
    },
    onError: (err: any) => {
      const data = err?.response?.data ?? err;
      setErrors(normalizeApiErrors(data));
    },
  });

  if (isLoading || !user) {
    return (
      <Page title="User" subtitle="Loading user…">
        <Card><div className="py-8 text-sm text-gray-500">Loading…</div></Card>
      </Page>
    );
  }

  const isPlayer = (form.role ?? user.role) === "PLAYER";

  return (
    <Page
      title={`${user.first_name} ${user.last_name}`}
      subtitle={`ID #${user.id} • ${user.email}`}
    >
      <Card className="space-y-6">
        <FieldError messages={errors["detail"] || errors["non_field_errors"]} />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fn">First name</Label>
            <Input
              id="fn"
              value={form.first_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            />
            <FieldError messages={errors["first_name"]} />
          </div>

          <div>
            <Label htmlFor="ln">Last name</Label>
            <Input
              id="ln"
              value={form.last_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            />
            <FieldError messages={errors["last_name"]} />
          </div>

          <div>
            <Label htmlFor="email">Email (read-only)</Label>
            <Input id="email" value={user.email} disabled />
            <FieldError messages={errors["email"]} />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="mt-1 block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={form.role ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <FieldError messages={errors["role"]} />
          </div>

          <div>
            <Label>Team</Label>
            <SearchableSelect
              value={form.team ?? null}
              onChange={(v) => setForm(f => ({ ...f, team: v ? Number(v) : null }))}
              fetchOptions={fetchTeamOptions}
              placeholder={
                selectedTeam ? `${selectedTeam.name} (ID ${selectedTeam.id})` : "Select a team…"
              }
              headLabel="Search by name, ID or location"
            />
            <FieldError messages={errors["team"]} />
          </div>
            

          <div>
            <Label htmlFor="dob">Date of birth (YYYY-MM-DD)</Label>
            <Input
              id="dob"
              placeholder="YYYY-MM-DD"
              value={form.date_of_birth ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            />
            <FieldError messages={errors["date_of_birth"]} />
          </div>

          {/* Only for players */}
          {isPlayer && (
            <>
              <div>
                <Label htmlFor="jersey">Jersey number</Label>
                <Input
                  id="jersey"
                  type="number"
                  value={form.jersey_number ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      jersey_number: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
                <FieldError messages={errors["jersey_number"]} />
              </div>

              <div>
                <Label htmlFor="pos">Position</Label>
                <select
                  id="pos"
                  className="mt-1 block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                  value={form.position ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, position: (e.target.value || null) as UserPosition | null }))
                  }
                >
                  {POSITIONS.map(p => <option key={p || "none"} value={p}>{p || "—"}</option>)}
                </select>
                <FieldError messages={errors["position"]} />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button disabled={isPending} onClick={() => save()}>Save changes</Button>
          <Button variant="secondary" onClick={() => nav(-1)}>Cancel</Button>
        </div>
      </Card>
    </Page>
  );
}
