import { api } from "./client";
import type { GatePolicy } from "@paperclipai/shared";

export interface GateCheckResult {
  gates: GatePolicy[];
  blocked: boolean;
}

export const gatePoliciesApi = {
  list: (companyId: string, params?: { scopeType?: string; scopeId?: string; action?: string }) => {
    const qs = new URLSearchParams();
    if (params?.scopeType) qs.set("scopeType", params.scopeType);
    if (params?.scopeId) qs.set("scopeId", params.scopeId);
    if (params?.action) qs.set("action", params.action);
    const q = qs.toString();
    return api.get<GatePolicy[]>(`/companies/${companyId}/gate-policies${q ? `?${q}` : ""}`);
  },
  get: (id: string) => api.get<GatePolicy>(`/gate-policies/${id}`),
  upsert: (companyId: string, body: {
    scopeType: string;
    scopeId: string;
    action: string;
    fulfillerType?: string;
    fulfillerId?: string | null;
    mode?: string;
    isActive?: boolean;
  }) => api.post<GatePolicy>(`/companies/${companyId}/gate-policies`, body),
  update: (id: string, body: Partial<{ fulfillerType: string; fulfillerId: string | null; mode: string; isActive: boolean }>) =>
    api.patch<GatePolicy>(`/gate-policies/${id}`, body),
  remove: (id: string) => api.delete(`/gate-policies/${id}`),
  check: (companyId: string, action: string, scope?: { scopeType: string; scopeId: string }) => {
    const qs = new URLSearchParams({ action });
    if (scope) {
      qs.set("scopeType", scope.scopeType);
      qs.set("scopeId", scope.scopeId);
    }
    return api.get<GateCheckResult>(`/companies/${companyId}/gate-policies/check?${qs}`);
  },
};
