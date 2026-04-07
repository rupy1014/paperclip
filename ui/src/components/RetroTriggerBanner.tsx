import { AlertTriangle } from "lucide-react";

export function RetroTriggerBanner({
  count,
  onViewClick,
}: {
  count: number;
  onViewClick?: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <div className="flex-1 text-sm">
        <span className="font-medium text-amber-800 dark:text-amber-200">
          {count} learning event{count !== 1 ? "s" : ""} pending review
        </span>
        <span className="text-amber-600 dark:text-amber-400 ml-1">
          — deviations or falsified assumptions detected
        </span>
      </div>
      {onViewClick && (
        <button
          onClick={onViewClick}
          className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline shrink-0"
        >
          View
        </button>
      )}
    </div>
  );
}
