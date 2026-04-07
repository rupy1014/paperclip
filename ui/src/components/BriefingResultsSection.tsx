import { Link } from "@/lib/router";
import { StatusBadge } from "./StatusBadge";
import { timeAgo } from "../lib/timeAgo";
import { FileBox } from "lucide-react";
import type { DeliverableBundle } from "@paperclipai/shared";

export function BriefingResultsSection({ results }: { results: DeliverableBundle[] }) {
  if (results.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <FileBox className="h-4 w-4" />
        Recent Results ({results.length})
      </h2>
      <div className="grid gap-2">
        {results.map((b) => (
          <Link
            key={b.id}
            to={`/bundles/${b.id}`}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/30 transition-colors no-underline text-inherit"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileBox className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-sm font-medium truncate">{b.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={b.status} />
              <span className="text-xs text-muted-foreground">
                {b.decidedAt ? timeAgo(b.decidedAt) : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
