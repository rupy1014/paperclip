import { api } from "./client";
import type { AssumptionEntry } from "@paperclipai/shared";

export const assumptionsApi = {
  list: (companyId: string, params?: { verificationStatus?: string; sourceType?: string; sourceId?: string; packetId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.verificationStatus) qs.set("verificationStatus", params.verificationStatus);
    if (params?.sourceType) qs.set("sourceType", params.sourceType);
    if (params?.sourceId) qs.set("sourceId", params.sourceId);
    if (params?.packetId) qs.set("packetId", params.packetId);
    const q = qs.toString();
    return api.get<AssumptionEntry[]>(`/companies/${companyId}/assumptions${q ? `?${q}` : ""}`);
  },
  get: (id: string) => api.get<AssumptionEntry>(`/assumptions/${id}`),
  create: (companyId: string, body: {
    sourceType: string;
    sourceId: string;
    statement: string;
    confidence?: string;
    packetId?: string | null;
    agentId?: string | null;
    sourceDescription?: string | null;
    verificationMethod?: string | null;
  }) => api.post<AssumptionEntry>(`/companies/${companyId}/assumptions`, body),
  update: (id: string, body: Partial<{
    statement: string;
    confidence: string;
    sourceDescription: string | null;
    verificationMethod: string | null;
  }>) => api.patch<AssumptionEntry>(`/assumptions/${id}`, body),
  verify: (id: string, verificationStatus: "verified" | "falsified") =>
    api.post<AssumptionEntry>(`/assumptions/${id}/verify`, { verificationStatus }),
  remove: (id: string) => api.delete(`/assumptions/${id}`),
};
