import { api } from "./client";
import type { WatchdogTarget, WatchdogCheckResult, CreateWatchdogTarget, UpdateWatchdogTarget, ReportCheckResult, LearningEvent } from "@paperclipai/shared";

export const watchdogApi = {
  list: (companyId: string, params?: { status?: string; agentId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.agentId) qs.set("agentId", params.agentId);
    const q = qs.toString();
    return api.get<WatchdogTarget[]>(`/companies/${companyId}/watchdog-targets${q ? `?${q}` : ""}`);
  },
  get: (companyId: string, id: string) =>
    api.get<WatchdogTarget>(`/companies/${companyId}/watchdog-targets/${id}`),
  create: (companyId: string, body: CreateWatchdogTarget) =>
    api.post<{ target: WatchdogTarget; routines: unknown[] }>(`/companies/${companyId}/watchdog-targets`, body),
  update: (companyId: string, id: string, body: UpdateWatchdogTarget) =>
    api.patch<WatchdogTarget>(`/companies/${companyId}/watchdog-targets/${id}`, body),
  remove: (companyId: string, id: string) =>
    api.delete(`/companies/${companyId}/watchdog-targets/${id}`),
  check: (companyId: string, id: string) =>
    api.post<{ issueId: string }>(`/companies/${companyId}/watchdog-targets/${id}/check`, {}),
  report: (companyId: string, id: string, body: ReportCheckResult) =>
    api.post(`/companies/${companyId}/watchdog-targets/${id}/report`, body),
  history: (companyId: string, id: string) =>
    api.get<LearningEvent[]>(`/companies/${companyId}/watchdog-targets/${id}/history`),
};
