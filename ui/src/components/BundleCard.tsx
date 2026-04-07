import { Link } from "@/lib/router";
import { StatusBadge } from "./StatusBadge";
import { timeAgo } from "../lib/timeAgo";
import { FileBox } from "lucide-react";
import type { DeliverableBundle } from "@paperclipai/shared";

export function BundleCard({
  bundle,
  packetIssueTitle,
}: {
  bundle: DeliverableBundle;
  packetIssueTitle?: string;
}) {
  return (
    <Link
      to={`/bundles/${bundle.id}`}
      className="block border border-border rounded-lg p-4 space-y-2 hover:bg-accent/30 transition-colors no-underline text-inherit"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileBox className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{bundle.title}</span>
        </div>
        <StatusBadge status={bundle.status} />
      </div>

      {bundle.ceoSummary && (
        <p className="text-xs text-muted-foreground line-clamp-2">{bundle.ceoSummary}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {packetIssueTitle && <span className="truncate">{packetIssueTitle}</span>}
        <span>{timeAgo(bundle.updatedAt)}</span>
      </div>
    </Link>
  );
}
