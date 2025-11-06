import api from "@/lib/axios";
import type { Attendance, Event } from "@/types";

export const calendarService = {
  async listEvents(): Promise<Event[]> {
    const { data } = await api.get("/calendar/events/");
    // If DRF viewset returns {results: []}, normalize:
    return Array.isArray(data) ? data : data.results ?? [];
  },

  async createEvent(payload: Partial<Event>): Promise<Event> {
    const { data } = await api.post("/calendar/events/", payload);
    return data;
  },

  async updateEvent(id: number, payload: Partial<Event>): Promise<Event> {
    const { data } = await api.put(`/calendar/events/${id}/`, payload);
    return data;
  },

  async deleteEvent(id: number): Promise<void> {
    await api.delete(`/calendar/events/${id}/`);
  },

  async listAttendance(eventId: number): Promise<Attendance[]> {
    const { data } = await api.get(`/calendar/events/${eventId}/attendance/`);
    return Array.isArray(data) ? data : data.results ?? [];
  },

  async updateAttendance(eventId: number, playerId: number, payload: Partial<Attendance>): Promise<Attendance> {
    const { data } = await api.put(`/calendar/events/${eventId}/attendance/${playerId}/`, payload);
    return data;
  },
};
