import type {
  DecisionPackage,
  CreateDecisionPackage,
  UpdateDecisionPackage,
  DecideDecisionPackage,
} from "@paperclipai/shared";
import { api } from "./client";

export const decisionsApi = {
  list: (companyId: string, filters?: { status?: string; bundleId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.bundleId) params.set("bundleId", filters.bundleId);
    const qs = params.toString();
    return api.get<DecisionPackage[]>(
      `/companies/${companyId}/decision-packages${qs ? `?${qs}` : ""}`,
    );
  },
  get: (id: string) => api.get<DecisionPackage>(`/decision-packages/${id}`),
  create: (companyId: string, data: CreateDecisionPackage) =>
    api.post<DecisionPackage>(`/companies/${companyId}/decision-packages`, data),
  update: (id: string, data: UpdateDecisionPackage) =>
    api.patch<DecisionPackage>(`/decision-packages/${id}`, data),
  decide: (id: string, data: DecideDecisionPackage) =>
    api.post<DecisionPackage>(`/decision-packages/${id}/decide`, data),
  defer: (id: string) =>
    api.post<DecisionPackage>(`/decision-packages/${id}/defer`, {}),
  reopen: (id: string) =>
    api.post<DecisionPackage>(`/decision-packages/${id}/reopen`, {}),
};
