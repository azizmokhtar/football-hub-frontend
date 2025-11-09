import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { teamsService } from "@/services/teams.service";
import { useNavigate } from "react-router-dom";

/** Create a team and assign OWNER (staff/admin user id).
 *  (Optionally) set head_coach user id now or later.
 */
export default function AdminTeamNewPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    location: "",
    owner: "" as string | number | null,
    head_coach: "" as string | number | null,
    established_date: "", // yyyy-mm-dd or leave empty
  });

  const { mutate: createTeam, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        location: form.location || null,
        owner: form.owner ? Number(form.owner) : null,
        head_coach: form.head_coach ? Number(form.head_coach) : null,
        established_date: form.established_date || null,
      };
      return teamsService.create(payload as any);
    },
    onSuccess: () => nav("/app/admin/teams"),
  });

  return (
    <Page title="Create Team" subtitle="Assign an owner (staff/admin user)">
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Team name</Label>
            <Input id="name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}/>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))}/>
          </div>
          <div>
            <Label htmlFor="owner">Owner user ID (STAFF/ADMIN)</Label>
            <Input id="owner" placeholder="e.g., 12" value={form.owner ?? ""} onChange={e => setForm(f => ({...f, owner: e.target.value}))}/>
          </div>
          <div>
            <Label htmlFor="coach">Head coach user ID (optional)</Label>
            <Input id="coach" placeholder="e.g., 7" value={form.head_coach ?? ""} onChange={e => setForm(f => ({...f, head_coach: e.target.value}))}/>
          </div>
          <div>
            <Label htmlFor="est">Established date</Label>
            <Input id="est" type="date" value={form.established_date} onChange={e => setForm(f => ({...f, established_date: e.target.value}))}/>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button disabled={isPending || !form.name.trim()} onClick={() => createTeam()}>Create team</Button>
          <Button variant="secondary" onClick={() => nav(-1)}>Cancel</Button>
        </div>
      </Card>
    </Page>
  );
}
