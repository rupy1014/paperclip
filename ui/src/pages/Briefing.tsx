import { useEffect } from "react";
import { Link, useNavigate } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { briefingApi } from "../api/briefing";
import { learningEventsApi } from "../api/learning-events";
import { assumptionsApi } from "../api/assumptions";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { MetricCard } from "../components/MetricCard";
import { PageSkeleton } from "../components/PageSkeleton";
import { EmptyState } from "../components/EmptyState";
import { RetroTriggerBanner } from "../components/RetroTriggerBanner";
import { formatCents } from "../lib/utils";
import { BriefingPushSection } from "../components/BriefingPushSection";
import { BriefingJudgmentSection } from "../components/BriefingJudgmentSection";
import { BriefingResultsSection } from "../components/BriefingResultsSection";
import { BriefingBlockedSection } from "../components/BriefingBlockedSection";
import {
  Briefcase,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import type { ProductionPacket, DeliverableBundle, DecisionPackage } from "@paperclipai/shared";

export function Briefing() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  const navigate = useNavigate();

  useEffect(() => {
    setBreadcrumbs([{ label: "Briefing" }]);
  }, [setBreadcrumbs]);

  const { data: pendingLearningEvents } = useQuery({
    queryKey: [...queryKeys.learningEvents.list(selectedCompanyId!), "pending"],
    queryFn: () => learningEventsApi.list(selectedCompanyId!, { status: "pending" }),
    enabled: !!selectedCompanyId,
    refetchInterval: 30_000,
  });

  const { data: unverifiedAssumptions } = useQuery({
    queryKey: [...queryKeys.assumptions.list(selectedCompanyId!), "unverified"],
    queryFn: () => assumptionsApi.list(selectedCompanyId!, { verificationStatus: "unverified" }),
    enabled: !!selectedCompanyId,
    refetchInterval: 30_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.briefing(selectedCompanyId!),
    queryFn: () => briefingApi.get(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 30_000,
  });

  if (isLoading) return <PageSkeleton />;
  if (!data) return <EmptyState icon={Briefcase} message="No briefing data" />;

  const pushing = data.pushing as ProductionPacket[];
  const decisions = data.judgment.decisions as DecisionPackage[];
  const bundles = data.judgment.bundles as DeliverableBundle[];
  const results = data.results as DeliverableBundle[];
  const blocked = data.blocked as Array<{ id: string; title: string; status: string; updatedAt: string }>;
  const { summary } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Active" value={summary.activePackets} icon={Briefcase} />
        <MetricCard label="Pending" value={summary.pendingBundles + summary.pendingDecisions} icon={ShieldCheck} />
        <MetricCard label="Blocked" value={summary.blockedIssues} icon={AlertTriangle} />
        <MetricCard
          label="Month Spend"
          value={formatCents(summary.monthSpendCents)}
          icon={DollarSign}
        />
      </div>

      {/* Learning events banner */}
      {(pendingLearningEvents?.length ?? 0) > 0 && (
        <RetroTriggerBanner
          count={pendingLearningEvents!.length}
          onViewClick={() => navigate("/assumptions")}
        />
      )}

      {/* Unverified assumptions count */}
      {(unverifiedAssumptions?.length ?? 0) > 0 && (
        <Link
          to="/assumptions"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/30 transition-colors no-underline text-inherit"
        >
          <BookOpen className="h-4 w-4 text-amber-500" />
          <span className="text-sm">
            <span className="font-medium">{unverifiedAssumptions!.length}</span>{" "}
            <span className="text-muted-foreground">unverified assumption{unverifiedAssumptions!.length !== 1 ? "s" : ""} to review</span>
          </span>
        </Link>
      )}

      {/* Risk highlights from pending decisions */}
      {summary.riskHighlights?.length > 0 && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-card p-4 space-y-2">
          <h2 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Risk Highlights ({summary.riskHighlights.length})
          </h2>
          <div className="space-y-1.5">
            {summary.riskHighlights.map((r: { decisionId: string; riskSummary: string }) => (
              <Link
                key={r.decisionId}
                to={`/decisions/${r.decisionId}`}
                className="block text-xs text-muted-foreground hover:text-foreground transition-colors no-underline truncate"
              >
                {r.riskSummary.slice(0, 200)}
              </Link>
            ))}
          </div>
        </div>
      )}

      <BriefingPushSection packets={pushing} />
      <BriefingJudgmentSection decisions={decisions} bundles={bundles} />
      <BriefingResultsSection results={results} />
      <BriefingBlockedSection blocked={blocked} />

      {/* Empty state */}
      {pushing.length === 0 &&
        decisions.length === 0 &&
        bundles.length === 0 &&
        results.length === 0 &&
        blocked.length === 0 && (
          <EmptyState
            icon={Briefcase}
            message="All clear — no active work, pending decisions, or blocked issues."
          />
        )}
    </div>
  );
}
