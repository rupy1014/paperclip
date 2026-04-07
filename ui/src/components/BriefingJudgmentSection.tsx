import { Link } from "@/lib/router";
import { StatusBadge } from "./StatusBadge";
import { DeadlineLabel } from "./DeadlineLabel";
import { Scale, FileBox } from "lucide-react";
import type { DecisionPackage, DeliverableBundle } from "@paperclipai/shared";

export function BriefingJudgmentSection({
  decisions,
  bundles,
}: {
  decisions: DecisionPackage[];
  bundles: DeliverableBundle[];
}) {
  if (decisions.length === 0 && bundles.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Scale className="h-4 w-4" />
        Judgment Needed ({decisions.length + bundles.length})
      </h2>
      <div className="grid gap-2">
        {decisions.map((dp) => (
          <Link
            key={dp.id}
            to={`/decisions/${dp.id}`}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/30 transition-colors no-underline text-inherit"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Scale className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-medium">Decision Package</span>
                {dp.ceoAssessment && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {dp.ceoAssessment.slice(0, 100)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {dp.deadline && <DeadlineLabel deadline={dp.deadline} />}
              <StatusBadge status={dp.status} />
            </div>
          </Link>
        ))}
        {bundles.map((b) => (
          <Link
            key={b.id}
            to={`/bundles/${b.id}`}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/30 transition-colors no-underline text-inherit"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileBox className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-medium truncate">{b.title}</span>
                {b.ceoSummary && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {b.ceoSummary.slice(0, 100)}
                  </p>
                )}
              </div>
            </div>
            <StatusBadge status={b.status} />
          </Link>
        ))}
      </div>
    </section>
  );
}
