import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToast } from "../context/ToastContext";
import { assumptionsApi } from "../api/assumptions";
import { queryKeys } from "../lib/queryKeys";
import { PageSkeleton } from "../components/PageSkeleton";
import { EmptyState } from "../components/EmptyState";
import { AssumptionRow } from "../components/AssumptionRow";
import { BookOpen, Filter } from "lucide-react";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "unverified", label: "Unverified" },
  { value: "verified", label: "Verified" },
  { value: "falsified", label: "Falsified" },
];

export function AssumptionRegistry() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setBreadcrumbs([
      { label: "Briefing", href: "/briefing" },
      { label: "Assumptions" },
    ]);
  }, [setBreadcrumbs]);

  const { data: assumptions, isLoading } = useQuery({
    queryKey: [...queryKeys.assumptions.list(selectedCompanyId!), statusFilter],
    queryFn: () =>
      assumptionsApi.list(selectedCompanyId!, statusFilter ? { verificationStatus: statusFilter } : undefined),
    enabled: !!selectedCompanyId,
  });

  const refresh = () => {
    if (!selectedCompanyId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.assumptions.list(selectedCompanyId) });
  };

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "verified" | "falsified" }) =>
      assumptionsApi.verify(id, status),
    onSuccess: (_data, { status }) => {
      refresh();
      pushToast({ title: `Assumption ${status}`, tone: "success" });
    },
    onError: (err) => {
      pushToast({ title: "Failed to update assumption", body: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    },
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Assumption Registry</h1>
        </div>
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Track assumptions made by agents during execution. Verify or falsify to improve output quality over time.
      </p>

      {/* Assumptions list */}
      {!assumptions || assumptions.length === 0 ? (
        <EmptyState icon={BookOpen} message="No assumptions recorded yet." />
      ) : (
        <div className="space-y-2">
          {assumptions.map((a) => (
            <AssumptionRow
              key={a.id}
              assumption={a}
              onVerify={(status) => verifyMutation.mutate({ id: a.id, status })}
              isVerifying={verifyMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
