import type { ProductionPacket, CreateProductionPacket, UpdateProductionPacket } from "@paperclipai/shared";
import { api } from "./client";

export const packetsApi = {
  list: (companyId: string, filters?: { status?: string; projectId?: string; ownerAgentId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.projectId) params.set("projectId", filters.projectId);
    if (filters?.ownerAgentId) params.set("ownerAgentId", filters.ownerAgentId);
    const qs = params.toString();
    return api.get<ProductionPacket[]>(
      `/companies/${companyId}/production-packets${qs ? `?${qs}` : ""}`,
    );
  },
  get: (id: string) => api.get<ProductionPacket>(`/production-packets/${id}`),
  create: (companyId: string, data: CreateProductionPacket) =>
    api.post<ProductionPacket>(`/companies/${companyId}/production-packets`, data),
  update: (id: string, data: UpdateProductionPacket) =>
    api.patch<ProductionPacket>(`/production-packets/${id}`, data),
  submitForReview: (id: string) =>
    api.post<ProductionPacket>(`/production-packets/${id}/submit-for-review`, {}),
};
