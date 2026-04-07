import { ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { GateReviewBadge } from "./GateReviewBadge";
import type { GatePolicy } from "@paperclipai/shared";

const ACTION_LABELS: Record<string, string> = {
  publish: "Publish",
  budget_exception: "Budget Exception",
  release: "Release",
  deploy: "Deploy",
  strategy_change: "Strategy Change",
};

export function GateRow({
  action,
  existing,
  onToggleActive,
  onToggleMode,
  onRemove,
}: {
  action: string;
  existing: GatePolicy | undefined;
  onToggleActive: () => void;
  onToggleMode: () => void;
  onRemove: () => void;
}) {
  const isActive = existing?.isActive ?? false;
  const mode = existing?.mode ?? "blocking";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <span className="text-sm font-medium min-w-0 truncate">
        {ACTION_LABELS[action] ?? action}
      </span>

      <div className="flex items-center gap-3 shrink-0">
        {/* Enable toggle */}
        <button
          onClick={onToggleActive}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isActive ? "Disable gate" : "Enable gate"}
        >
          {isActive ? (
            <ToggleRight className="h-5 w-5 text-green-500" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
        </button>

        {/* Mode toggle */}
        {existing && isActive ? (
          <button onClick={onToggleMode} aria-label={`Switch to ${mode === "blocking" ? "advisory" : "blocking"} mode`}>
            <GateReviewBadge mode={mode} />
          </button>
        ) : (
          <span className="text-xs text-muted-foreground w-16 text-center">—</span>
        )}

        {/* Delete */}
        {existing ? (
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-500 transition-colors"
            aria-label="Remove gate policy"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-4" />
        )}
      </div>
    </div>
  );
}
