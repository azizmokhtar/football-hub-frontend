// services/communication.service.ts
import api from "@/lib/axios";
import type { Announcement, Conversation, Message } from "@/types";

export const communicationService = {
  async listConversations(): Promise<Conversation[]> {
    const { data } = await api.get("/communication/conversations/");
    return Array.isArray(data) ? data : data.results ?? [];
  },

  async createConversation(payload: Partial<Conversation>): Promise<Conversation> {
    const { data } = await api.post("/communication/conversations/", payload);
    return data;
  },

  // NEW: start a DM
  async startDM(userId: number): Promise<Conversation> {
    const { data } = await api.post("/communication/conversations/start_dm/", { user_id: userId });
    return data;
  },

  // NEW: add participants to a group
  async addParticipants(conversationId: number, participantIds: number[]): Promise<Conversation> {
    const { data } = await api.post(
      `/communication/conversations/${conversationId}/add_participants/`,
      { participant_ids: participantIds }
    );
    return data;
  },

  async listMessages(conversationId: number): Promise<Message[]> {
    const { data } = await api.get(`/communication/conversations/${conversationId}/messages/`);
    return Array.isArray(data) ? data : data.results ?? [];
  },

  async sendMessage(conversationId: number, content: string): Promise<Message> {
    const { data } = await api.post(`/communication/conversations/${conversationId}/messages/`, { content });
    return data;
  },

  async listAnnouncements(): Promise<Announcement[]> {
    const { data } = await api.get("/communication/announcements/");
    return Array.isArray(data) ? data : data.results ?? [];
  },

  async createAnnouncement(payload: Partial<Announcement>): Promise<Announcement> {
    const { data } = await api.post("/communication/announcements/", payload);
    return data;
  },

  async markAnnouncementRead(id: number): Promise<Announcement> {
    const { data } = await api.post(`/communication/announcements/${id}/read/`);
    return data;
  },
};
