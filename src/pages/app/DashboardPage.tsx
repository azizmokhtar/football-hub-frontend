import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { communicationService } from "@/services/communication.service";
import { calendarService } from "@/services/calendar.service";
import { useAuthUser } from "@/stores/auth.store";
import { format, isWithinInterval, addDays, parseISO } from "date-fns";

export default function DashboardPage() {
  const user = useAuthUser();

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: communicationService.listAnnouncements,
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: calendarService.listEvents,
  });

  const upcoming7Days = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    const in7 = addDays(now, 7);
    return events
      .filter((e) =>
        isWithinInterval(parseISO(e.start_time), { start: now, end: in7 })
      )
      .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))
      .slice(0, 6);
  }, [events]);

  return (
    <Page
      title="Dashboard"
      subtitle={`Welcome back, ${user?.first_name ?? "Coach"}!`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Next 7 days</h2>
            <a href="/app/calendar" className="text-sm text-blue-600 hover:underline">
              View calendar
            </a>
          </div>
          <div className="divide-y">
            {upcoming7Days?.length ? (
              upcoming7Days.map((e) => (
                <div key={e.id} className="py-3 flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      {format(parseISO(e.start_time), "EEE dd MMM, HH:mm")}
                    </div>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-gray-500">
                      {e.event_type} {e.location ? `• ${e.location}` : ""}
                    </div>
                  </div>
                  <a
                    href="/app/calendar"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Details
                  </a>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-gray-500">No events in the next 7 days.</div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Announcements</h2>
            <a href="/app/communication" className="text-sm text-blue-600 hover:underline">
              Messages
            </a>
          </div>
          <div className="space-y-3">
            {announcements?.slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-lg border border-gray-100 p-3">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>{format(new Date(a.timestamp), "dd MMM HH:mm")}</span>
                  <span>•</span>
                  <span>{a.team_name}</span>
                  <span>•</span>
                  <span>by <span className="font-medium">{a.sender_name ?? "System"}</span></span>
                  {a.is_urgent && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">
                        URGENT
                      </span>
                    </>
                  )}
                </div>

                <p className="mt-1 text-sm text-gray-700 line-clamp-2">{a.content}</p>
              </div>
            )) ?? <div className="text-sm text-gray-500">No announcements.</div>}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Quick actions</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild><a href="/app/calendar">Open calendar</a></Button>
            <Button variant="secondary" asChild><a href="/app/communication">Open messages</a></Button>
            <Button variant="outline" asChild><a href="/app/documents">Browse documents</a></Button>
            <Button variant="ghost" asChild><a href="/app/team">View team</a></Button>
          </div>
        </Card>
      </div>
    </Page>
  );
}
