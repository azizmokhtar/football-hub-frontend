// src/pages/admin/AdminUserDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import FieldError from "@/components/FieldError";

import { usersService } from "@/services/users.service";
import { teamsService } from "@/services/teams.service";
import { profilesService } from "@/services/profiles.service";

import { normalizeApiErrors, type ApiErrors } from "@/utils/api-errors";
import type { CustomUser, UserRole, Position, Team } from "@/types";

const ROLE_OPTIONS: UserRole[] = ["PLAYER", "COACH", "STAFF", "ADMIN"];

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const nav = useNavigate();

  // --- User (basic info) ---
  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => usersService.getUser(userId),
    enabled: Number.isFinite(userId),
  });

  const [form, setForm] = useState<Partial<CustomUser> & { date_of_birth?: string | null }>({});
  const [errors, setErrors] = useState<ApiErrors>({});

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
      });
    }
  }, [user]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const patch = {
        first_name: form.first_name ?? "",
        last_name: form.last_name ?? "",
        role: form.role as UserRole,
      };
      return usersService.updateUser(userId, patch);
    },
    onSuccess: () => {
      setErrors({});
      nav("/app/admin/users");
    },
    onError: (err: any) => setErrors(normalizeApiErrors(err?.response?.data ?? err)),
  });

  // --- Membership editor (team-scoped fields) ---
  // We let the admin pick which team membership to edit, then set primary_position / jersey_number.
  const { data: teams = [] } = useQuery({
    queryKey: ["teams-all"],
    queryFn: () => teamsService.listAll(),
  });

  const { data: positions = [], isLoading: posLoading } = useQuery({
    queryKey: ["profiles-positions"],
    queryFn: () => profilesService.listPositions(),
    staleTime: 60_000,
  });

  // Group positions by line for a nicer <select>
  const groupedPositions = React.useMemo(() => {
    const map = new Map<Position["line"], Position[]>();
    positions.forEach((p) => {
      map.set(p.line, [...(map.get(p.line) ?? []), p]);
    });
    const order: Position["line"][] = ["GK", "DF", "MF", "FW"];
    return order
      .filter((line) => map.has(line))
      .map((line) => [line, (map.get(line) ?? []).sort((a, b) => a.name.localeCompare(b.name))] as const);
  }, [positions]);

  const [membership, setMembership] = useState<{
    teamId: number | "";
    primaryPositionId: number | "";// Position.id
    jerseyNumber: number | "";// optional
  }>({ teamId: "", primaryPositionId: "", jerseyNumber: "" });

  const { mutate: saveMembership, isPending: savingMembership } = useMutation({
    mutationFn: async () => {
      if (!membership.teamId) throw new Error("Please choose a team.");
      return teamsService.updateMember(Number(membership.teamId), {
        user_id: userId,
        primary_position: membership.primaryPositionId ? Number(membership.primaryPositionId) : null,
        jersey_number: membership.jerseyNumber === "" ? null : Number(membership.jerseyNumber),
      });
    },
    onSuccess: () => {
      // Optional: toast / small success UI — here we just clear field-level errors
      setErrors({});
    },
    onError: (err: any) => setErrors(normalizeApiErrors(err?.response?.data ?? err)),
  });

  if (isLoading || !user) {
    return (
      <Page title="User" subtitle="Loading user…">
        <Card><div className="py-8 text-sm text-gray-500">Loading…</div></Card>
      </Page>
    );
  }

  return (
    <Page title={`${user.first_name} ${user.last_name}`} subtitle={`ID #${user.id} • ${user.email}`}>
      {/* --- Basic profile card --- */}
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
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <FieldError messages={errors["role"]} />
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
        </div>

        <div className="flex gap-2">
          <Button disabled={isPending} onClick={() => save()}>Save changes</Button>
          <Button variant="secondary" onClick={() => nav(-1)}>Cancel</Button>
        </div>
      </Card>

      {/* --- Membership (Team-scoped) card --- */}
      <Card className="mt-6 space-y-4">
        <div className="text-lg font-semibold">Membership (team-scoped)</div>
        <p className="text-sm text-gray-600">
          Edit fields that live on the team membership: <em>primary position</em> and <em>jersey number</em>.
          Pick the team first (if this user has multiple memberships or you’re reassigning).
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          {/* Team selection */}
          <div>
            <Label>Team</Label>
            <select
              className="mt-1 block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={membership.teamId}
              onChange={(e) => setMembership((m) => ({ ...m, teamId: e.target.value ? Number(e.target.value) : "" }))}
            >
              <option value="">Select a team…</option>
              {teams.map((t: Team) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.location ? `• ${t.location}` : ""}
                </option>
              ))}
            </select>
            <FieldError messages={errors["team"]} />
          </div>

          {/* Primary position (from profiles.positions) */}
          <div>
            <Label>Primary position</Label>
            <select
              className="mt-1 block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={membership.primaryPositionId}
              onChange={(e) =>
                setMembership((m) => ({ ...m, primaryPositionId: e.target.value ? Number(e.target.value) : "" }))
              }
              disabled={posLoading}
            >
              <option value="">Select…</option>
              {groupedPositions.map(([line, list]) => (
                <optgroup key={line} label={line}>
                  {list.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <FieldError messages={errors["primary_position"]} />
          </div>

          {/* Jersey number */}
          <div>
            <Label>Jersey number</Label>
            <Input
              type="number"
              placeholder="e.g., 10"
              value={membership.jerseyNumber}
              onChange={(e) =>
                setMembership((m) => ({
                  ...m,
                  jerseyNumber: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
            />
            <FieldError messages={errors["jersey_number"]} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => saveMembership()}
            disabled={savingMembership || !membership.teamId}
          >
            {savingMembership ? "Saving…" : "Update membership"}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              setMembership({ teamId: "", primaryPositionId: "", jerseyNumber: "" })
            }
          >
            Reset
          </Button>
        </div>
      </Card>
    </Page>
  );
}
