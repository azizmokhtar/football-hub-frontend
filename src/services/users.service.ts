import api from "@/lib/axios";
import type { CustomUser } from "@/types";
import { z } from "zod";

// (re)use your register schema shape, but keep it local here too
export const AdminCreateUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: z.enum(['PLAYER','COACH','STAFF','ADMIN']),
  team: z.number().nullable().optional(),
  password: z.string().min(8),
  password2: z.string().min(8),
});

export type AdminCreateUserPayload = z.infer<typeof AdminCreateUserSchema>;

export const usersService = {
  async adminListAll(q?: string): Promise<CustomUser[]> {
    const { data } = await api.get(`/users/admin/list/${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    return Array.isArray(data) ? data : data.results ?? [];
  },

  // allows filtering roles server-side if available
  async adminListAllWithRole(q: string | undefined, roles: string[]): Promise<CustomUser[]> {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    roles.forEach(r => params.append("role", r)); // repeatable parameter
    const qs = params.toString();
    const { data } = await api.get(`/users/admin/list/${qs ? `?${qs}` : ""}`);
    return Array.isArray(data) ? data : data.results ?? [];
  },


  async createUser(payload: AdminCreateUserPayload): Promise<CustomUser> {
    const { data } = await api.post("/users/auth/register/", payload);
    return data;
  },

  async getUser(id: number): Promise<CustomUser> {
    const { data } = await api.get(`/users/${id}/`);
    return data;
  },

  async updateUser(id: number, patch: Partial<CustomUser> & { team?: number | null }): Promise<CustomUser> {
    const { data } = await api.patch(`/users/${id}/`, patch);
    return data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}/`);
  },
};
