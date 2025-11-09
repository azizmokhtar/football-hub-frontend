import api from "@/lib/axios";
import type { Team, TeamMember } from "@/types";

export const teamsService = {
  async myTeam(): Promise<Team> {
    const { data } = await api.get("/teams/my/");
    return data as Team;
  },

  async getSquad(teamId: number) {
    const { data } = await api.get(`/teams/${teamId}/squad/`);
    return data;
  },

  async getStaff(teamId: number) {
    const { data } = await api.get(`/teams/${teamId}/staff/`);
    return data;
  },
  async listAll(): Promise<Team[]> {
    const { data } = await api.get("/teams/");
    return Array.isArray(data) ? data : data.results ?? [];
  },

  async create(payload: Partial<Team>): Promise<Team> {
    const { data } = await api.post("/teams/", payload);
    return data;
  },

  async update(id: number, payload: Partial<Team>): Promise<Team> {
    const { data } = await api.put(`/teams/${id}/`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/teams/${id}/`);
  },
  async get(id: number): Promise<Team> {
    const { data } = await api.get(`/teams/${id}/`);
    return data;
  },
  async addMember(teamId: number, payload: { user_id: number; role: 'PLAYER' | 'STAFF' | 'COACH' }) {
    const { data } = await api.post(`/teams/${teamId}/add_member/`, payload);
    return data; // returns UserTeamListSerializer
  },

  async removeMember(teamId: number, payload: { user_id: number }) {
    await api.post(`/teams/${teamId}/remove_member/`, payload);
  },
  async createMember(teamId: number, payload: FormData | Record<string, any>) {
    // support file upload; if plain object, send JSON
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    const { data } = await api.post(
      `/teams/${teamId}/create_member/`,
      payload,
      isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
    );
    return data; // UserTeamListSerializer
  },
  
  async updateMember(teamId: number, payload: FormData | Record<string, any>) {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    const { data } = await api.patch(
      `/teams/${teamId}/update_member/`,
      payload,
      isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
    );
    return data;
  },
  
};