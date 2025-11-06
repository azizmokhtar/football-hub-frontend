import api from "@/lib/axios";
import type { Team, TeamMember } from "@/types";

export const teamsService = {
  async myTeam(): Promise<Team> {
    // If you don’t have "my-team" endpoint, fetch all + find user.team by id via store.
    const { data } = await api.get("/teams/");
    const list: Team[] = Array.isArray(data) ? data : data.results ?? [];
    return list[0]; // fallback; adjust if you add a dedicated endpoint
  },

  async getSquad(teamId: number): Promise<{ id: number; name: string; players: TeamMember[] }> {
    const { data } = await api.get(`/teams/${teamId}/squad/`);
    return data;
  },

  async getStaff(teamId: number): Promise<{ id: number; name: string; staff: TeamMember[] }> {
    const { data } = await api.get(`/teams/${teamId}/staff/`);
    return data;
  },
};
