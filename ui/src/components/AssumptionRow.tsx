import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "../lib/timeAgo";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AssumptionEntry } from "@paperclipai/shared";

const SOURCE_LABELS: Record<string, string> = {
  document: "Document",
  work_product: "Work Product",
  decision_package: "Decision Package",
};

const PROVENANCE_STYLES: Record<string, string> = {
  estimate: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  benchmark: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  verified: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

export function AssumptionRow({
  assumption,
  onVerify,
  isVerifying,
}: {
  assumption: AssumptionEntry;
  onVerify: (status: "verified" | "falsified") => void;
  isVerifying: boolean;
}) {
  const isUnverified = assumption.verificationStatus === "unverified";
  const [confirming, setConfirming] = useState<"verified" | "falsified" | null>(null);

  const handleClick = (status: "verified" | "falsified") => {
    if (confirming === status) {
      onVerify(status);
      setConfirming(null);
    } else {
      setConfirming(status);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm">{assumption.statement}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <ConfidenceBadge level={assumption.confidence} />
            <StatusBadge status={assumption.verificationStatus} />
            <span className="text-[10px] text-muted-foreground">
              {SOURCE_LABELS[assumption.sourceType] ?? assumption.sourceType}
            </span>
            {assumption.source && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PROVENANCE_STYLES[assumption.source] ?? ""}`}>
                {assumption.source}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {timeAgo(assumption.createdAt)}
            </span>
          </div>
          {assumption.sourceDescription && (
            <p className="text-xs text-muted-foreground mt-1">{assumption.sourceDescription}</p>
          )}
        </div>

        {isUnverified && (
          <div className="flex items-center gap-1 shrink-0">
            {confirming && (
              <span className="text-[10px] text-muted-foreground mr-1">
                {confirming === "verified" ? "Confirm verify?" : "Confirm falsify?"}
              </span>
            )}
            <Button
              variant={confirming === "verified" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => handleClick("verified")}
              disabled={isVerifying}
              aria-label="Verify assumption"
              title="Verify"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </Button>
            <Button
              variant={confirming === "falsified" ? "destructive" : "ghost"}
              size="icon-sm"
              onClick={() => handleClick("falsified")}
              disabled={isVerifying}
              aria-label="Falsify assumption"
              title="Falsify"
            >
              <XCircle className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
