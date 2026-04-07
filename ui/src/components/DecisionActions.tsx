import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, RotateCcw } from "lucide-react";

export function DecisionActions({
  status,
  selectedOption,
  onDecide,
  onDefer,
  onReopen,
  isDeciding,
  isDeferring,
  isReopening,
}: {
  status: string;
  selectedOption: string | null;
  onDecide: (option: string) => void;
  onDefer: () => void;
  onReopen: () => void;
  isDeciding: boolean;
  isDeferring: boolean;
  isReopening: boolean;
}) {
  const isPending = status === "pending";
  const isDeferred = status === "deferred";

  return (
    <div className="space-y-3">
      {isPending && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="default"
            onClick={() => selectedOption && onDecide(selectedOption)}
            disabled={!selectedOption || isDeciding}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Decide{selectedOption ? `: ${selectedOption}` : ""}
          </Button>
          <Button
            variant="outline"
            onClick={onDefer}
            disabled={isDeferring}
          >
            <Clock className="h-4 w-4 mr-1" />
            Defer
          </Button>
        </div>
      )}

      {isDeferred && (
        <Button
          onClick={onReopen}
          disabled={isReopening}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reopen
        </Button>
      )}
    </div>
  );
}
