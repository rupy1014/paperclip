import { useEffect, useState } from "react";
import { useParams, Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bundlesApi } from "../api/bundles";
import { packetsApi } from "../api/packets";
import { assumptionsApi } from "../api/assumptions";
import { decisionsApi } from "../api/decisions";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToast } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { StatusBadge } from "../components/StatusBadge";
import { MarkdownBody } from "../components/MarkdownBody";
import { PageSkeleton } from "../components/PageSkeleton";
import { FileBox, BookOpen, Scale } from "lucide-react";
import { BundleActions } from "../components/BundleActions";
import type { DeliverableBundleItem } from "@paperclipai/shared";
import { ConfidenceBadge } from "../components/ConfidenceBadge";

const TYPE_LABELS: Record<string, string> = {
  document: "Documents",
  work_product: "Work Products",
  issue: "Issues",
};

export function BundleDetail() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [decisionNote, setDecisionNote] = useState("");

  const { data: bundle, isLoading } = useQuery({
    queryKey: queryKeys.bundles.detail(bundleId!),
    queryFn: () => bundlesApi.get(bundleId!),
    enabled: !!bundleId,
  });

  const { data: items } = useQuery({
    queryKey: queryKeys.bundles.items(bundleId!),
    queryFn: () => bundlesApi.listItems(bundleId!),
    enabled: !!bundleId,
  });

  const { data: packet } = useQuery({
    queryKey: queryKeys.packets.detail(bundle?.packetId ?? ""),
    queryFn: () => packetsApi.get(bundle!.packetId),
    enabled: !!bundle?.packetId,
  });

  const { data: assumptions } = useQuery({
    queryKey: [...queryKeys.assumptions.list(bundle?.companyId ?? ""), "packet", bundle?.packetId],
    queryFn: () => assumptionsApi.list(bundle!.companyId, { packetId: bundle!.packetId }),
    enabled: !!bundle?.companyId && !!bundle?.packetId,
  });

  // Find the decision package linked to this bundle
  const { data: linkedDecisions } = useQuery({
    queryKey: [...queryKeys.decisions.list(bundle?.companyId ?? ""), "bundle", bundleId],
    queryFn: () => decisionsApi.list(bundle!.companyId, { bundleId: bundleId! }),
    enabled: !!bundle?.companyId && !!bundleId,
  });
  const linkedDecision = linkedDecisions?.[0];

  useEffect(() => {
    if (!bundle?.companyId || bundle.companyId === selectedCompanyId) return;
    setSelectedCompanyId(bundle.companyId, { source: "route_sync" });
  }, [bundle?.companyId, selectedCompanyId, setSelectedCompanyId]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Bundles" },
      { label: bundle?.title ?? bundleId?.slice(0, 8) ?? "Bundle" },
    ]);
  }, [setBreadcrumbs, bundle, bundleId]);

  const refresh = () => {
    if (!bundleId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.bundles.detail(bundleId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.bundles.items(bundleId) });
  };

  const decideMutation = useMutation({
    mutationFn: (decision: "approved" | "rejected" | "revision_requested") =>
      bundlesApi.decide(bundleId!, { decision, decisionNote: decisionNote || null }),
    onSuccess: (_data, decision) => {
      setDecisionNote("");
      refresh();
      const labels = { approved: "approved", rejected: "rejected", revision_requested: "revision requested" };
      pushToast({ title: `Bundle ${labels[decision]}`, tone: "success" });
    },
    onError: (err) => {
      pushToast({ title: "Failed to decide", body: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    },
  });

  const presentMutation = useMutation({
    mutationFn: () => bundlesApi.present(bundleId!),
    onSuccess: () => {
      refresh();
      pushToast({ title: "Bundle presented for review", tone: "success" });
    },
    onError: (err) => {
      pushToast({ title: "Failed to present", body: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: () => bundlesApi.resubmit(bundleId!),
    onSuccess: () => {
      refresh();
      pushToast({ title: "Bundle resubmitted", tone: "success" });
    },
    onError: (err) => {
      pushToast({ title: "Failed to resubmit", body: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (!bundle) return <div className="p-6 text-muted-foreground">Bundle not found</div>;

  const itemsByType = (items ?? []).reduce(
    (acc, item) => {
      (acc[item.itemType] ??= []).push(item);
      return acc;
    },
    {} as Record<string, DeliverableBundleItem[]>,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileBox className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">{bundle.title}</h1>
          </div>
          <StatusBadge status={bundle.status} />
        </div>
      </div>

      {/* Linked Decision Package */}
      {linkedDecision && (
        <Link
          to={`/decisions/${linkedDecision.id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          <Scale className="h-4 w-4" />
          <span>Decision Package</span>
          <StatusBadge status={linkedDecision.status} />
        </Link>
      )}

      {/* CEO Summary */}
      {bundle.ceoSummary && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">CEO Summary</h2>
          <MarkdownBody>{bundle.ceoSummary}</MarkdownBody>
        </div>
      )}

      {/* Bundle Items */}
      {(items ?? []).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Deliverables ({items!.length})
          </h2>
          {Object.entries(itemsByType).map(([type, typeItems]) => (
            <div key={type} className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
              </div>
              {typeItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm border border-border rounded px-3 py-2"
                >
                  <span className="text-sm">{(item as unknown as { resolvedTitle?: string }).resolvedTitle ?? item.itemId.slice(0, 8)}</span>
                  {item.annotation && (
                    <span className="text-xs text-muted-foreground truncate ml-2">
                      {item.annotation}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Decision Note (if decided) */}
      {bundle.decisionNote && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Decision Note</h2>
          <MarkdownBody>{bundle.decisionNote}</MarkdownBody>
        </div>
      )}

      {/* Related Assumptions */}
      {(assumptions ?? []).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            Assumptions ({assumptions!.length})
          </h2>
          <div className="space-y-1.5">
            {assumptions!.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-sm border border-border rounded px-3 py-2"
              >
                <span className="truncate mr-2">{a.statement}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <ConfidenceBadge level={a.confidence} />
                  <StatusBadge status={a.verificationStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <BundleActions
        status={bundle.status}
        decisionNote={decisionNote}
        onDecisionNoteChange={setDecisionNote}
        onPresent={() => presentMutation.mutate()}
        onDecide={(decision) => decideMutation.mutate(decision)}
        onResubmit={() => resubmitMutation.mutate()}
        isPresenting={presentMutation.isPending}
        isDeciding={decideMutation.isPending}
        isResubmitting={resubmitMutation.isPending}
      />
    </div>
  );
}
