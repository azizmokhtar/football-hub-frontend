import api from "@/lib/axios";
import type { Document } from "@/types";

export const documentsService = {
  async list(): Promise<Document[]> {
    const { data } = await api.get("/documents/");
    return Array.isArray(data) ? data : data.results ?? [];
  },

  async upload(form: FormData): Promise<Document> {
    const { data } = await api.post("/documents/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/documents/${id}/`);
  },
};
