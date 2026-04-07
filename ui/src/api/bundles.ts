import type {
  DeliverableBundle,
  DeliverableBundleItem,
  CreateDeliverableBundle,
  UpdateDeliverableBundle,
  AddBundleItem,
  DecideBundle,
} from "@paperclipai/shared";
import { api } from "./client";

export const bundlesApi = {
  list: (companyId: string, filters?: { status?: string; packetId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.packetId) params.set("packetId", filters.packetId);
    const qs = params.toString();
    return api.get<DeliverableBundle[]>(
      `/companies/${companyId}/deliverable-bundles${qs ? `?${qs}` : ""}`,
    );
  },
  get: (id: string) => api.get<DeliverableBundle>(`/deliverable-bundles/${id}`),
  create: (companyId: string, data: CreateDeliverableBundle) =>
    api.post<DeliverableBundle>(`/companies/${companyId}/deliverable-bundles`, data),
  update: (id: string, data: UpdateDeliverableBundle) =>
    api.patch<DeliverableBundle>(`/deliverable-bundles/${id}`, data),
  present: (id: string) =>
    api.post<DeliverableBundle>(`/deliverable-bundles/${id}/present`, {}),
  decide: (id: string, data: DecideBundle) =>
    api.post<DeliverableBundle>(`/deliverable-bundles/${id}/decide`, data),
  resubmit: (id: string) =>
    api.post<DeliverableBundle>(`/deliverable-bundles/${id}/resubmit`, {}),

  // Items
  listItems: (bundleId: string) =>
    api.get<DeliverableBundleItem[]>(`/deliverable-bundles/${bundleId}/items`),
  addItem: (bundleId: string, data: AddBundleItem) =>
    api.post<DeliverableBundleItem>(`/deliverable-bundles/${bundleId}/items`, data),
  removeItem: (bundleId: string, itemId: string) =>
    api.delete(`/deliverable-bundles/${bundleId}/items/${itemId}`),
};
