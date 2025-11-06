import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { teamsService } from "@/services/teams.service";
import { useAuthUser } from "@/stores/auth.store";

export default function TeamPage() {
  const user = useAuthUser();
  const teamId = user?.team ?? null;

  const { data: squad } = useQuery({
    enabled: !!teamId,
    queryKey: ["team", teamId, "squad"],
    queryFn: () => teamsService.getSquad(teamId!),
  });

  const { data: staff } = useQuery({
    enabled: !!teamId,
    queryKey: ["team", teamId, "staff"],
    queryFn: () => teamsService.getStaff(teamId!),
  });

  const players = squad?.players ?? [];
  const staffers = staff?.staff ?? [];

  const groupedPlayers = useMemo(() => {
    const map = new Map<string, typeof players>();
    players.forEach((p) => {
      const key = p.position ?? "Unknown";
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [players]);

  return (
    <Page title="My Team" subtitle={squad?.name ?? "—"}>
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
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.profile_picture} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-600 font-semibold">
                              {p.first_name[0] ?? "?"}
                              {p.last_name[0] ?? ""}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{p.first_name} {p.last_name}</div>
                          <div className="text-xs text-gray-500">
                            #{p.jersey_number ?? "—"} • {p.role}
                          </div>
                        </div>
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
              <div key={s.id} className="rounded-lg border p-3">
                <div className="font-medium">{s.first_name} {s.last_name}</div>
                <div className="text-xs text-gray-500">{s.role}</div>
              </div>
            )) : <div className="text-sm text-gray-500">No staff.</div>}
          </div>
        </Card>
      </div>
    </Page>
  );
}
