import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { teamsService } from "@/services/teams.service";
import { Link } from "react-router-dom";

export default function AdminTeamsListPage() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ["admin-teams"],
    queryFn: teamsService.listAll,
  });

  return (
    <Page title="Teams" subtitle="All registered teams">
      <div className="mb-4">
        <Button asChild><Link to="/app/admin/teams/new">New Team</Link></Button>
      </div>
      <Card>
        {isLoading ? (
          <div className="py-8 text-sm text-gray-500">Loading teams…</div>
        ) : teams?.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map(t => (
              <div key={t.id} className="rounded-lg border p-3 hover:bg-gray-50">
                <Link to={`/app/admin/teams/${t.id}`} className="font-medium underline">
                  {t.name}
                </Link>
                <div className="text-xs text-gray-500">
                  Owner: {t.owner_name ?? "—"} {t.owner_email ? `(${t.owner_email})` : ""}
                </div>
                <div className="text-xs text-gray-500">
                  Head coach: {t.head_coach_name ?? "—"}
                </div>
                {t.location && <div className="text-xs text-gray-500">Location: {t.location}</div>}
              </div>
              
            ))}
          </div>
        ) : (
          <div className="py-8 text-sm text-gray-500">No teams yet.</div>
        )}
      </Card>
    </Page>
  );
}
