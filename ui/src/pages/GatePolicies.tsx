import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GATE_POLICY_ACTIONS } from "@paperclipai/shared";
import type { GatePolicy } from "@paperclipai/shared";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToast } from "../context/ToastContext";
import { gatePoliciesApi } from "../api/gate-policies";
import { queryKeys } from "../lib/queryKeys";
import { PageSkeleton } from "../components/PageSkeleton";
import { EmptyState } from "../components/EmptyState";
import { GateRow } from "../components/GateRow";
import { ShieldCheck } from "lucide-react";

export function GatePolicies() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Settings", href: "/company/settings" },
      { label: "Gates" },
    ]);
  }, [setBreadcrumbs]);

  const { data: policies, isLoading } = useQuery({
    queryKey: queryKeys.gatePolicies.list(selectedCompanyId!),
    queryFn: () => gatePoliciesApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const refresh = () => {
    if (!selectedCompanyId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.gatePolicies.list(selectedCompanyId) });
  };

  const upsertMutation = useMutation({
    mutationFn: (input: { action: string; mode: string; isActive: boolean }) =>
      gatePoliciesApi.upsert(selectedCompanyId!, {
        scopeType: "company",
        scopeId: selectedCompanyId!,
        action: input.action,
        mode: input.mode,
        isActive: input.isActive,
      }),
    onSuccess: () => {
      refresh();
      pushToast({ title: "Gate policy saved", tone: "success" });
    },
  });

  const toggleModeMutation = useMutation({
    mutationFn: (policy: GatePolicy) =>
      gatePoliciesApi.update(policy.id, {
        mode: policy.mode === "blocking" ? "advisory" : "blocking",
      }),
    onSuccess: (_data, policy) => {
      refresh();
      const newMode = policy.mode === "blocking" ? "advisory" : "blocking";
      pushToast({ title: `Gate switched to ${newMode}`, tone: "success" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (policy: GatePolicy) =>
      gatePoliciesApi.update(policy.id, { isActive: !policy.isActive }),
    onSuccess: (_data, policy) => {
      refresh();
      pushToast({ title: `Gate ${policy.isActive ? "disabled" : "enabled"}`, tone: "success" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => gatePoliciesApi.remove(id),
    onSuccess: () => {
      refresh();
      pushToast({ title: "Gate policy removed", tone: "success" });
    },
  });

  if (isLoading) return <PageSkeleton />;

  const policyMap = new Map<string, GatePolicy>();
  for (const p of policies ?? []) {
    policyMap.set(p.action, p);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Gate Policies</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Configure which high-risk actions require review or approval before proceeding.
        Blocking gates halt execution until resolved. Advisory gates notify but don't block.
      </p>

      {/* Action table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground">
          <span>Action</span>
          <span>Controls</span>
        </div>
        {GATE_POLICY_ACTIONS.map((action) => {
          const existing = policyMap.get(action);
          return (
            <GateRow
              key={action}
              action={action}
              existing={existing}
              onToggleActive={() => {
                if (existing) {
                  toggleActiveMutation.mutate(existing);
                } else {
                  upsertMutation.mutate({ action, mode: "blocking", isActive: true });
                }
              }}
              onToggleMode={() => existing && toggleModeMutation.mutate(existing)}
              onRemove={() => existing && removeMutation.mutate(existing.id)}
            />
          );
        })}
      </div>

      {/* Empty hint */}
      {(!policies || policies.length === 0) && (
        <p className="text-xs text-muted-foreground text-center">
          No gate policies configured yet. Enable an action above to require review or approval.
        </p>
      )}
    </div>
  );
}
