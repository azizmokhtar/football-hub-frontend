import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { calendarService } from "@/services/calendar.service";
import type { Attendance, Event } from "@/types";
import { useAuthUser } from "@/stores/auth.store";
import { format, parseISO } from "date-fns";
import { cn } from "@/utils/cn";

export default function CalendarPage() {
  const user = useAuthUser();
  const qc = useQueryClient();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: calendarService.listEvents,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    (events ?? []).forEach((e) => {
      const d = format(parseISO(e.start_time), "yyyy-MM-dd");
      map.set(d, [...(map.get(d) ?? []), e]);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  const { data: attendance } = useQuery({
    enabled: !!activeEvent?.id && (user?.role === "COACH" || user?.role === "ADMIN"),
    queryKey: ["attendance", activeEvent?.id],
    queryFn: () => calendarService.listAttendance(activeEvent!.id),
  });

  const { mutate: updateAttendance, isPending: savingAttendance } = useMutation({
    mutationFn: (payload: { eventId: number; playerId: number; status: Attendance["status"] }) =>
      calendarService.updateAttendance(payload.eventId, payload.playerId, { status: payload.status }),
    onSuccess: () => {
      if (activeEvent?.id) qc.invalidateQueries({ queryKey: ["attendance", activeEvent.id] });
    },
  });

  return (
    <Page
      title="Calendar"
      subtitle="Team events, matches, and training sessions"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          {isLoading ? (
            <div className="py-10 text-sm text-gray-500">Loading events…</div>
          ) : grouped.length ? (
            <div className="space-y-6">
              {grouped.map(([d, list]) => (
                <div key={d}>
                  <div className="text-xs uppercase text-gray-500 mb-2">
                    {format(new Date(d), "EEE, dd MMM yyyy")}
                  </div>
                  <div className="space-y-2">
                    {list
                      .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))
                      .map((e) => (
                        <button
                          key={e.id}
                          className={cn(
                            "w-full text-left rounded-lg border p-3 hover:bg-gray-50",
                            activeEvent?.id === e.id && "border-blue-500 bg-blue-50"
                          )}
                          onClick={() => setActiveEvent(e)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{e.title}</div>
                            <div className="text-sm text-gray-600">
                              {format(parseISO(e.start_time), "HH:mm")} – {format(parseISO(e.end_time), "HH:mm")}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {e.event_type} {e.location ? `• ${e.location}` : ""} {e.is_mandatory ? "• Mandatory" : ""}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-sm text-gray-500">No events.</div>
          )}
        </Card>

        <Card>
          {activeEvent ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">
                  {format(parseISO(activeEvent.start_time), "EEE dd MMM, HH:mm")} –{" "}
                  {format(parseISO(activeEvent.end_time), "HH:mm")}
                </div>
                <h3 className="text-lg font-semibold">{activeEvent.title}</h3>
                <div className="text-xs text-gray-500">
                  {activeEvent.event_type} {activeEvent.location ? `• ${activeEvent.location}` : ""}
                </div>
              </div>

              {activeEvent.description && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{activeEvent.description}</p>
              )}

              {/* Player quick self RSVP (update their own attendance) could be added if you expose endpoint per-self.
                  Current API updates a specific player's attendance by event+player; leave for coach/admin table below. */}

              {(user?.role === "COACH" || user?.role === "ADMIN") && (
                <>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Attendance</h4>
                      <span className="text-xs text-gray-500">{attendance?.length ?? 0} players</span>
                    </div>
                    <div className="max-h-[360px] overflow-auto divide-y">
                      {attendance?.map((a) => (
                        <div key={a.id} className="py-2 text-sm flex items-center justify-between">
                          <div>
                            <div className="font-medium">{a.player_name}</div>
                            <div className="text-xs text-gray-500">{a.player_position ?? "—"}</div>
                          </div>
                          <div className="flex gap-2">
                            {(["PRESENT", "ABSENT", "INJURED", "EXCUSED"] as Attendance["status"][]).map((s) => (
                              <Button
                                key={s}
                                variant={a.status === s ? "default" : "outline"}
                                size="sm"
                                disabled={savingAttendance}
                                onClick={() =>
                                  updateAttendance({ eventId: activeEvent.id, playerId: a.player, status: s })
                                }
                              >
                                {s === "PRESENT" && "Present"}
                                {s === "ABSENT" && "Absent"}
                                {s === "INJURED" && "Injured"}
                                {s === "EXCUSED" && "Excused"}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )) ?? <div className="py-6 text-xs text-gray-500">No attendance records.</div>}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-10 text-sm text-gray-500">Select an event to see details.</div>
          )}
        </Card>
      </div>
    </Page>
  );
}
