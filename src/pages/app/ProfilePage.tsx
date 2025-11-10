import React, { useState } from "react";
import { Page, Card } from "@/components/ui/Page";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthUser, useAuthActions } from "@/stores/auth.store";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";

export default function ProfilePage() {
  const user = useAuthUser();
  const { setUser } = useAuthActions();
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [dob, setDob] = useState(user?.date_of_birth ?? "");

  // Password change (your API uses PUT /users/auth/password/change/ with {password})
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: async () => {
      // Editable here: first_name, last_name, date_of_birth (membership fields are NOT updated here)
      const updated = await (await import("@/lib/axios")).default.put(`/users/${user!.id}/`, {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob || null
      });
      return updated.data;
    },
    onSuccess: (updatedUser) => setUser(updatedUser),
  });

  const { mutate: changePwd, isPending: changingPwd } = useMutation({
    mutationFn: () =>
      authService.changePassword({
        new_password: newPwd,
        confirm_password: confirmPwd,
      } as any),
    onSuccess: () => {
      setNewPwd("");
      setConfirmPwd("");
      // Optional: toast success
    },
  });

  return (
    <Page title="Profile" subtitle="Manage your personal information">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Personal info</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fn">First name</Label>
              <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ln">Last name</Label>
              <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email (read-only)</Label>
              <Input id="email" value={user?.email ?? ""} readOnly />
            </div>
            <div>
              <Label htmlFor="role">Role (read-only)</Label>
              <Input id="role" value={user?.role ?? ""} readOnly />
            </div>
            <div>
              <Label htmlFor="team">Team (read-only)</Label>
              <Input id="team" value={user?.team_name ?? "—"} readOnly />
            </div>
            <div>
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" value={dob ?? ""} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pos">Position</Label>
              <Input id="pos" value={position ?? ""} onChange={(e) => setPosition(e.target.value)} placeholder="GK/DF/MF/FW" />
            </div>
          </div>

          <div className="mt-4">
            <Button disabled={savingProfile} onClick={() => saveProfile()}>
              {savingProfile ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Change password</h2>
          <div className="space-y-3">
            <div>
              <Label htmlFor="np">New password</Label>
              <Input id="np" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cp">Confirm new password</Label>
              <Input id="cp" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
            </div>
            <Button
              disabled={!newPwd || newPwd !== confirmPwd || changingPwd}
              onClick={() => changePwd()}
            >
              {changingPwd ? "Updating…" : "Update password"}
            </Button>
          </div>
        </Card>
      </div>
    </Page>
  );
}
