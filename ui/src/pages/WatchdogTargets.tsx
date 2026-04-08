import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { watchdogApi } from "../api/watchdog";
import { queryKeys } from "../lib/queryKeys";
import { PageSkeleton } from "../components/PageSkeleton";
import { EmptyState } from "../components/EmptyState";
import type { WatchdogTarget } from "@paperclipai/shared";

const RECOVERY_COLORS: Record<string, string> = {
  none: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  L1: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  L2: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  L3: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  disabled: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

function RecoveryIcon({ level }: { level: string }) {
  if (level === "none") return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (level === "L1") return <Activity className="h-4 w-4 text-amber-600" />;
  return <AlertTriangle className="h-4 w-4 text-red-600" />;
}

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {text}
    </span>
  );
}

function TargetCard({ target }: { target: WatchdogTarget }) {
  const config = target.serviceConfig;
  return (
    <Link
      to={`/watchdog/${target.id}`}
      className="block rounded-lg border border-border bg-card p-4 hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RecoveryIcon level={target.currentRecoveryLevel} />
          <div>
            <h3 className="text-sm font-medium">{target.name}</h3>
            <p className="text-xs text-muted-foreground">
              {target.serviceType} &middot; {config.cwd}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            text={target.status}
            colorClass={STATUS_COLORS[target.status] ?? STATUS_COLORS.disabled}
          />
          {target.currentRecoveryLevel !== "none" && (
            <Badge
              text={target.currentRecoveryLevel}
              colorClass={RECOVERY_COLORS[target.currentRecoveryLevel] ?? RECOVERY_COLORS.L3}
            />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        {target.consecutiveFailures > 0 && (
          <span className="text-red-600 dark:text-red-400">
            {target.consecutiveFailures} consecutive failure{target.consecutiveFailures > 1 ? "s" : ""}
          </span>
        )}
        {target.lastHealthyAt && (
          <span>Last healthy: {new Date(target.lastHealthyAt).toLocaleString()}</span>
        )}
        {target.lastIncidentAt && (
          <span>Last incident: {new Date(target.lastIncidentAt).toLocaleString()}</span>
        )}
      </div>
    </Link>
  );
}

export function WatchdogTargets() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "Watchdog" }]);
  }, [setBreadcrumbs]);

  const { data: targets, isLoading } = useQuery({
    queryKey: queryKeys.watchdog.list(selectedCompanyId!),
    queryFn: () => watchdogApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Watchdog Targets</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        External services monitored by Paperclip agents. Health checks, stall detection,
        and error rate monitoring run automatically via routines.
      </p>

      {(!targets || targets.length === 0) ? (
        <EmptyState
          icon={Eye}
          message="No watchdog targets. Create one via API to start monitoring an external service."
        />
      ) : (
        <div className="space-y-3">
          {targets.map((t) => (
            <TargetCard key={t.id} target={t} />
          ))}
        </div>
      )}
    </div>
  );
}
