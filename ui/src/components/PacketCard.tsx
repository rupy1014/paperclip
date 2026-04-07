import { Link } from "@/lib/router";
import { StatusBadge } from "./StatusBadge";
import { Identity } from "./Identity";
import { timeAgo } from "../lib/timeAgo";
import { Package } from "lucide-react";
import type { ProductionPacket } from "@paperclipai/shared";

export function PacketCard({
  packet,
  agentName,
  issueTitle,
  issueIdentifier,
}: {
  packet: ProductionPacket;
  agentName?: string;
  issueTitle?: string;
  issueIdentifier?: string;
}) {
  return (
    <Link
      to={`/issues/${issueIdentifier ?? packet.issueId}`}
      className="block border border-border rounded-lg p-4 space-y-2 hover:bg-accent/30 transition-colors no-underline text-inherit"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {issueIdentifier && (
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {issueIdentifier}
                </span>
              )}
              <span className="text-sm font-medium truncate">
                {issueTitle ?? packet.issueId.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={packet.status} />
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {agentName && <Identity name={agentName} size="sm" />}
        <span>{timeAgo(packet.updatedAt)}</span>
      </div>
    </Link>
  );
}
