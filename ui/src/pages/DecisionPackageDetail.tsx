import { useEffect, useState } from "react";
import { useParams, Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { decisionsApi } from "../api/decisions";
import { bundlesApi } from "../api/bundles";
import { assumptionsApi } from "../api/assumptions";
import { learningEventsApi } from "../api/learning-events";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToast } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { StatusBadge } from "../components/StatusBadge";
import { MarkdownBody } from "../components/MarkdownBody";
import { PageSkeleton } from "../components/PageSkeleton";
import { Scale, FileBox, AlertTriangle, CheckCircle2, BookOpen } from "lucide-react";
import { DecisionActions } from "../components/DecisionActions";
import { KpiDeviationIndicator } from "../components/KpiDeviationIndicator";
import { DeadlineLabel } from "../components/DeadlineLabel";
import type { DecisionOption } from "@paperclipai/shared";
import { ConfidenceBadge } from "../components/ConfidenceBadge";

export function DecisionPackageDetail() {
  const { decisionId } = useParams<{ decisionId: string }>();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const { data: dp, isLoading } = useQuery({
    queryKey: queryKeys.decisions.detail(decisionId!),
    queryFn: () => decisionsApi.get(decisionId!),
    enabled: !!decisionId,
  });

  const { data: bundle } = useQuery({
    queryKey: queryKeys.bundles.detail(dp?.bundleId ?? ""),
    queryFn: () => bundlesApi.get(dp!.bundleId),
    enabled: !!dp?.bundleId,
  });

  const { data: liveAssumptions } = useQuery({
    queryKey: [...queryKeys.assumptions.list(dp?.companyId ?? ""), "packet", bundle?.packetId],
    queryFn: () => assumptionsApi.list(dp!.companyId, { packetId: bundle!.packetId }),
    enabled: !!dp?.companyId && !!bundle?.packetId,
  });

  const { data: deviationEvents } = useQuery({
    queryKey: [...queryKeys.learningEvents.list(dp?.companyId ?? ""), "packet", bundle?.packetId, "deviation"],
    queryFn: () =>
      learningEventsApi.list(dp!.companyId, {
        packetId: bundle!.packetId,
        triggerType: "deviation_detected",
      }),
    enabled: !!dp?.companyId && !!bundle?.packetId,
  });

  useEffect(() => {
    if (!dp?.companyId || dp.companyId === selectedCompanyId) return;
    setSelectedCompanyId(dp.companyId, { source: "route_sync" });
  }, [dp?.companyId, selectedCompanyId, setSelectedCompanyId]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Briefing", href: "/briefing" },
      { label: dp?.decidedOption ? `Decision: ${dp.decidedOption}` : "Decision" },
    ]);
  }, [setBreadcrumbs, dp]);

  // Auto-select recommended option on first load
  useEffect(() => {
    if (dp?.status === "pending" && !selectedOption) {
      const rec = ((dp.decisionOptions ?? []) as DecisionOption[]).find((o) => o.recommended);
      if (rec) setSelectedOption(rec.label);
    }
  }, [dp?.status, dp?.decisionOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => {
    if (!decisionId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.decisions.detail(decisionId) });
  };

  const decideMutation = useMutation({
    mutationFn: (decidedOption: string) =>
      decisionsApi.decide(decisionId!, { decidedOption }),
    onSuccess: (_data, decidedOption) => {
      refresh();
      pushToast({ title: `Decided: ${decidedOption}`, tone: "success" });
    },
    onError: (err) => {
      pushToast({ title: "Failed to decide", body: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    },
  });

  const deferMutation = useMutation({
    mutationFn: () => decisionsApi.defer(decisionId!),
    onSuccess: () => {
      refresh();
      pushToast({ title: "Decision deferred", tone: "success" });
    },
    onError: (err) => {
      pushToast({ title: "Failed to defer", body: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => decisionsApi.reopen(decisionId!),
    onSuccess: () => {
      refresh();
      pushToast({ title: "Decision reopened", tone: "success" });
    },
    onError: (err) => {
      pushToast({ title: "Failed to reopen", body: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (!dp) return <div className="p-6 text-muted-foreground">Decision package not found</div>;

  const isPending = dp.status === "pending";
  const options = (dp.decisionOptions ?? []) as DecisionOption[];
  const recommendedOption = options.find((o) => o.recommended);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Decision Package</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dp.deadline && <DeadlineLabel deadline={dp.deadline} />}
          <StatusBadge status={dp.status} />
        </div>
      </div>

      {/* Linked bundle */}
      {bundle && (
        <Link
          to={`/bundles/${bundle.id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          <FileBox className="h-4 w-4" />
          <span>{bundle.title}</span>
        </Link>
      )}

      {/* CEO Assessment */}
      {dp.ceoAssessment && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">CEO Assessment</h2>
          <MarkdownBody>{dp.ceoAssessment}</MarkdownBody>
        </div>
      )}

      {/* Risk Summary */}
      {dp.riskSummary && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-card p-4 space-y-2">
          <h2 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Risk Summary
          </h2>
          <MarkdownBody>{dp.riskSummary}</MarkdownBody>
        </div>
      )}

      {/* Decision Options */}
      {options.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Options
            {isPending && (
              <span className="font-normal ml-1">— select one to decide</span>
            )}
          </h2>
          <div className="grid gap-2">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => isPending && setSelectedOption(opt.label)}
                disabled={!isPending}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  selectedOption === opt.label
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : opt.recommended && isPending
                      ? "border-green-300 dark:border-green-800 hover:bg-accent/30"
                      : "border-border hover:bg-accent/30"
                } ${!isPending ? "cursor-default opacity-70" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-2">
                  {isPending && (
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedOption === opt.label ? "border-primary" : "border-muted-foreground/40"
                    }`}>
                      {selectedOption === opt.label && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  )}
                  <span className="text-sm font-medium">{opt.label}</span>
                  {opt.recommended && (
                    <span className="text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                  {dp.decidedOption === opt.label && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
                {opt.description && (
                  <p className="text-xs text-muted-foreground mt-1 ml-6">{opt.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Assumptions */}
      {(liveAssumptions ?? []).length > 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            Assumptions ({liveAssumptions!.length})
          </h2>
          <div className="space-y-1.5">
            {liveAssumptions!.map((a) => (
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
      ) : dp.assumptionsSnapshot && dp.assumptionsSnapshot.length > 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Assumptions (snapshot)</h2>
          <div className="space-y-2">
            {(dp.assumptionsSnapshot as Record<string, unknown>[]).map((a, i) => (
              <div key={i} className="text-sm border border-border rounded px-3 py-2">
                {String(a.statement ?? a.description ?? JSON.stringify(a))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* KPI Deviations */}
      {(deviationEvents ?? []).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Deviations ({deviationEvents!.length})
          </h2>
          <div className="grid gap-2">
            {deviationEvents!.map((ev) => (
              <KpiDeviationIndicator
                key={ev.id}
                expected={ev.expectedOutcome ?? "N/A"}
                actual={ev.actualOutcome ?? "N/A"}
                magnitude={ev.deviationMagnitude ?? "minor"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <DecisionActions
        status={dp.status}
        selectedOption={selectedOption}
        onDecide={(opt) => decideMutation.mutate(opt)}
        onDefer={() => deferMutation.mutate()}
        onReopen={() => reopenMutation.mutate()}
        isDeciding={decideMutation.isPending}
        isDeferring={deferMutation.isPending}
        isReopening={reopenMutation.isPending}
      />
    </div>
  );
}
