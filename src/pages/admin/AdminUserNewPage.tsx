// src/pages/admin/AdminUserNewPage.tsx
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import FieldError from "@/components/FieldError";
import { usersService, AdminCreateUserSchema } from "@/services/users.service";
import { normalizeApiErrors, type ApiErrors } from "@/utils/api-errors";
import { useNavigate } from "react-router-dom";

export default function AdminUserNewPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "STAFF" as "PLAYER" | "COACH" | "STAFF" | "ADMIN",
    team: "" as string | number | null,
    password: "",
    password2: "",
  });

  const [errors, setErrors] = useState<ApiErrors>({});

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: async () => {
      // basic client-side schema (structure only)
      const payload = {
        ...form,
        team: form.team ? Number(form.team) : null,
      };
      AdminCreateUserSchema.parse(payload);
      return usersService.createUser(payload as any);
    },
    onSuccess: () => {
      setErrors({});
      nav("/app/admin/users");
    },
    onError: (err: any) => {
      // DRF returns field errors in err.response.data
      const data = err?.response?.data ?? err;
      setErrors(normalizeApiErrors(data));
    },
  });

  return (
    <Page title="Create User" subtitle="Add a new user and (optionally) assign a team">
      <Card>
        {/* Global / non-field errors */}
        <FieldError messages={errors["detail"] || errors["non_field_errors"]} />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fn">First name</Label>
            <Input
              id="fn"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            />
            <FieldError messages={errors["first_name"]} />
          </div>

          <div>
            <Label htmlFor="ln">Last name</Label>
            <Input
              id="ln"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            />
            <FieldError messages={errors["last_name"]} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <FieldError messages={errors["email"]} />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="mt-1 block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}
            >
              <option>PLAYER</option>
              <option>COACH</option>
              <option>STAFF</option>
              <option>ADMIN</option>
            </select>
            <FieldError messages={errors["role"]} />
          </div>

          <div>
            <Label htmlFor="team">Team (optional ID)</Label>
            <Input
              id="team"
              placeholder="e.g., 3"
              value={form.team ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
            />
            <FieldError messages={errors["team"]} />
          </div>

          <div>
            <Label htmlFor="pw1">Password</Label>
            <Input
              id="pw1"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            {/* <-- Weak password messages (too short/common/similar/etc.) will show here */}
            <FieldError messages={errors["password"]} />
            <p className="mt-1 text-xs text-gray-500">
              At least 8 chars, not common, not only numbers, not too similar to name/email.
            </p>
          </div>

          <div>
            <Label htmlFor="pw2">Confirm password</Label>
            <Input
              id="pw2"
              type="password"
              value={form.password2}
              onChange={(e) => setForm((f) => ({ ...f, password2: e.target.value }))}
            />
            <FieldError messages={errors["password2"]} />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button disabled={isPending} onClick={() => createUser()}>
            Create user
          </Button>
          <Button variant="secondary" onClick={() => nav(-1)}>
            Cancel
          </Button>
        </div>
      </Card>
    </Page>
  );
}
