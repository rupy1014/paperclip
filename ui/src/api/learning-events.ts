import { api } from "./client";
import type { LearningEvent } from "@paperclipai/shared";

export const learningEventsApi = {
  list: (companyId: string, params?: { status?: string; triggerType?: string; packetId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.triggerType) qs.set("triggerType", params.triggerType);
    if (params?.packetId) qs.set("packetId", params.packetId);
    const q = qs.toString();
    return api.get<LearningEvent[]>(`/companies/${companyId}/learning-events${q ? `?${q}` : ""}`);
  },
  get: (id: string) => api.get<LearningEvent>(`/learning-events/${id}`),
  create: (companyId: string, body: {
    triggerType: string;
    packetId?: string | null;
    sourceAgentId?: string | null;
    targetAgentIds?: string[] | null;
    expectedOutcome?: string | null;
    actualOutcome?: string | null;
    deviationMagnitude?: string | null;
    constraintText?: string | null;
  }) => api.post<LearningEvent>(`/companies/${companyId}/learning-events`, body),
  transition: (id: string, status: string) =>
    api.post<LearningEvent>(`/learning-events/${id}/transition`, { status }),
  linkRetro: (id: string, retroIssueId: string) =>
    api.post<LearningEvent>(`/learning-events/${id}/link-retro`, { retroIssueId }),
  detectDeviation: (
    companyId: string,
    body: { packetId: string; expected: number; actual: number; metric: string; threshold?: number },
  ) =>
    api.post<{ detected: boolean; event?: LearningEvent; message?: string }>(
      `/companies/${companyId}/learning-events/detect-deviation`,
      body,
    ),
  createRetro: (id: string) =>
    api.post<unknown>(`/learning-events/${id}/create-retro`, {}),
  propagate: (id: string, targetAgentIds: string[]) =>
    api.post<LearningEvent>(`/learning-events/${id}/propagate`, { targetAgentIds }),
};
