// src/services/teams.service.ts
import api from "@/lib/axios";
import type { Team } from "@/types";

export const teamsService = {
  async myTeam(): Promise<Team> {
    const { data } = await api.get("/teams/my/");
    return data as Team;
  },

  async getSquad(teamId: number, opts?: { season?: number }) {
    const qs = opts?.season ? `?season=${opts.season}` : "";
    const { data } = await api.get(`/teams/${teamId}/squad/${qs}`);
    return data;
  },

  async getStaff(teamId: number, opts?: { season?: number }) {
    const qs = opts?.season ? `?season=${opts.season}` : "";
    const { data } = await api.get(`/teams/${teamId}/staff/${qs}`);
    return data;
  },

  async listAll() {
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
    return data;
  },

  async removeMember(teamId: number, payload: { user_id: number }) {
    await api.post(`/teams/${teamId}/remove_member/`, payload);
  },

  async createMember(teamId: number, payload: FormData | Record<string, any>) {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    const { data } = await api.post(
      `/teams/${teamId}/create_member/`,
      payload,
      isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
    );
    return data;
  },

  async updateMember(
    teamId: number,
    payload: {
      user_id: number;
      jersey_number?: number | null;
      primary_position?: number | null;
      squad_status?: string | null;
    }
  ) {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    const { data } = await api.patch(
      `/teams/${teamId}/update_member/`,
      payload,
      isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
    );
    return data;
  },


  // Optional sugar (both just call update):
  async setOwner(teamId: number, ownerId: number | null) {
    return this.update(teamId, { owner: ownerId } as Partial<Team>);
  },
  async setHeadCoach(teamId: number, coachId: number | null) {
    return this.update(teamId, { head_coach: coachId } as Partial<Team>);
  },
};
