import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Activity, AlertTriangle, CheckCircle, Play, Clock, FileText } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToast } from "../context/ToastContext";
import { watchdogApi } from "../api/watchdog";
import { queryKeys } from "../lib/queryKeys";
import { PageSkeleton } from "../components/PageSkeleton";
import { Button } from "@/components/ui/button";
import type { WatchdogTarget, LearningEvent } from "@paperclipai/shared";

const RECOVERY_COLORS: Record<string, string> = {
  none: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  L1: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  L2: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  L3: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {text}
    </span>
  );
}

function ConfigField({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono">{String(value)}</span>
    </div>
  );
}

function EventRow({ event }: { event: LearningEvent }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="mt-0.5">
        {event.deviationMagnitude === "major" ? (
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <Activity className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate">{event.constraintText ?? event.triggerType}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(event.createdAt).toLocaleString()} &middot; {event.status}
        </p>
      </div>
    </div>
  );
}

export function WatchdogTargetDetail() {
  const { id } = useParams<{ id: string }>();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const { data: target, isLoading } = useQuery({
    queryKey: queryKeys.watchdog.detail(selectedCompanyId!, id!),
    queryFn: () => watchdogApi.get(selectedCompanyId!, id!),
    enabled: !!selectedCompanyId && !!id,
  });

  const { data: history } = useQuery({
    queryKey: queryKeys.watchdog.history(selectedCompanyId!, id!),
    queryFn: () => watchdogApi.history(selectedCompanyId!, id!),
    enabled: !!selectedCompanyId && !!id,
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: "Watchdog", href: "/watchdog" },
      { label: target?.name ?? "..." },
    ]);
  }, [setBreadcrumbs, target?.name]);

  const checkMutation = useMutation({
    mutationFn: () => watchdogApi.check(selectedCompanyId!, id!),
    onSuccess: (data) => {
      pushToast({ title: "Check triggered", tone: "success", body: `Issue ${data.issueId.slice(0, 8)} created` });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchdog.detail(selectedCompanyId!, id!) });
    },
    onError: () => pushToast({ title: "Check failed", tone: "error" }),
  });

  if (isLoading || !target) return <PageSkeleton />;

  const config = target.serviceConfig as unknown as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">{target.name}</h1>
            <p className="text-xs text-muted-foreground">
              {target.serviceType} &middot; {config.cwd as string}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            text={target.currentRecoveryLevel === "none" ? "Healthy" : target.currentRecoveryLevel}
            colorClass={RECOVERY_COLORS[target.currentRecoveryLevel] ?? RECOVERY_COLORS.none}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Check Now
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Consecutive Failures</p>
          <p className={`text-lg font-semibold ${target.consecutiveFailures > 0 ? "text-red-600" : ""}`}>
            {target.consecutiveFailures}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Last Healthy</p>
          <p className="text-sm">
            {target.lastHealthyAt ? new Date(target.lastHealthyAt).toLocaleString() : "Never"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Last Incident</p>
          <p className="text-sm">
            {target.lastIncidentAt ? new Date(target.lastIncidentAt).toLocaleString() : "None"}
          </p>
        </div>
      </div>

      {/* Service Configuration */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-2 border-b border-border">
          <h2 className="text-sm font-medium">Service Configuration</h2>
        </div>
        <div className="px-4 py-2">
          <ConfigField label="Service Name" value={config.serviceName as string} />
          <ConfigField label="PID File" value={config.pidFile as string} />
          <ConfigField label="Heartbeat File" value={config.heartbeatFile as string} />
          <ConfigField label="Health Check Command" value={config.healthCheckCommand as string} />
          <ConfigField label="Restart Command" value={config.restartCommand as string} />
          <ConfigField label="Stall Threshold (min)" value={config.stallThresholdMinutes as number} />
          <ConfigField label="Error Rate Threshold" value={config.errorRateThreshold as number} />
          <ConfigField label="Error Rate Window (min)" value={config.errorRateWindowMinutes as number} />
          {Array.isArray(config.logPaths) && config.logPaths.length > 0 && (
            <ConfigField label="Log Paths" value={(config.logPaths as string[]).join(", ")} />
          )}
        </div>
      </div>

      {/* Check History */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Check History</h2>
        </div>
        <div className="px-4 py-2">
          {(!history || history.length === 0) ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No watchdog events recorded yet.</p>
          ) : (
            history.slice(0, 20).map((event) => (
              <EventRow key={event.id} event={event} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
