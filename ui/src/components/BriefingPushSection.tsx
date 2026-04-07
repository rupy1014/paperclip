import { Link } from "@/lib/router";
import { StatusBadge } from "./StatusBadge";
import { timeAgo } from "../lib/timeAgo";
import { Briefcase } from "lucide-react";
import type { ProductionPacket } from "@paperclipai/shared";

export function BriefingPushSection({ packets }: { packets: ProductionPacket[] }) {
  if (packets.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Briefcase className="h-4 w-4" />
        Pushing ({packets.length})
      </h2>
      <div className="grid gap-2">
        {packets.map((pkt) => (
          <Link
            key={pkt.id}
            to={`/issues/${pkt.issueId}`}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/30 transition-colors no-underline text-inherit"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">
                {pkt.issueId.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={pkt.status} />
              <span className="text-xs text-muted-foreground">{timeAgo(pkt.updatedAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
