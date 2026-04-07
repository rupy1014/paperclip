import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export function BundleActions({
  status,
  decisionNote,
  onDecisionNoteChange,
  onPresent,
  onDecide,
  onResubmit,
  isPresenting,
  isDeciding,
  isResubmitting,
}: {
  status: string;
  decisionNote: string;
  onDecisionNoteChange: (value: string) => void;
  onPresent: () => void;
  onDecide: (decision: "approved" | "rejected" | "revision_requested") => void;
  onResubmit: () => void;
  isPresenting: boolean;
  isDeciding: boolean;
  isResubmitting: boolean;
}) {
  const isPending = status === "pending";
  const isPresented = status === "presented";
  const isRevisionRequested = status === "revision_requested";

  return (
    <div className="space-y-3">
      {isPending && (
        <Button onClick={onPresent} disabled={isPresenting}>
          Present for Review
        </Button>
      )}

      {isPresented && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium">Decision</h2>
          <Textarea
            placeholder="Decision note (optional)"
            value={decisionNote}
            onChange={(e) => onDecisionNoteChange(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="default"
              onClick={() => onDecide("approved")}
              disabled={isDeciding}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => onDecide("revision_requested")}
              disabled={isDeciding}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Request Revision
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDecide("rejected")}
              disabled={isDeciding}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      )}

      {isRevisionRequested && (
        <Button onClick={onResubmit} disabled={isResubmitting}>
          Resubmit
        </Button>
      )}
    </div>
  );
}
