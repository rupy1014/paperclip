import { Link } from "@/lib/router";
import { timeAgo } from "../lib/timeAgo";
import { AlertTriangle, CircleDot } from "lucide-react";

export function BriefingBlockedSection({
  blocked,
}: {
  blocked: Array<{ id: string; title: string; status: string; updatedAt: string }>;
}) {
  if (blocked.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Blocked ({blocked.length})
      </h2>
      <div className="grid gap-2">
        {blocked.map((issue) => (
          <Link
            key={issue.id}
            to={`/issues/${issue.id}`}
            className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-900/50 bg-card px-4 py-3 hover:bg-accent/30 transition-colors no-underline text-inherit"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CircleDot className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-sm font-medium truncate">{issue.title}</span>
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo(issue.updatedAt)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
