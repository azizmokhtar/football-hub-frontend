// src/services/profiles.service.ts
import api from "@/lib/axios";

export type PositionLine = "GK" | "DF" | "MF" | "FW";

export interface PositionDto {
  id: number;
  key: string;
  name: string;
  line: PositionLine;
}

export interface SpecialtyDto {
  id: number;
  key: string;
  name: string;
}

export interface LicenseDto {
  id: number;
  key: string;
  name: string;
  issuer: string | null;
}

export const profilesService = {
  async listPositions(): Promise<PositionDto[]> {
    const { data } = await api.get("/profiles/positions/");
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  async listSpecialties(): Promise<SpecialtyDto[]> {
    const { data } = await api.get("/profiles/specialties/"); // add this endpoint in DRF if not present
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  async listLicenses(): Promise<LicenseDto[]> {
    const { data } = await api.get("/profiles/licenses/"); // add this endpoint in DRF if not present
    return Array.isArray(data) ? data : (data.results ?? []);
  },
};