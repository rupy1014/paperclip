const MODE_STYLES: Record<string, string> = {
  blocking: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  advisory: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
};

const MODE_LABELS: Record<string, string> = {
  blocking: "Blocking",
  advisory: "Advisory",
};

export function GateReviewBadge({ mode }: { mode: string }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
        MODE_STYLES[mode] ?? MODE_STYLES.blocking
      }`}
    >
      {MODE_LABELS[mode] ?? mode}
    </span>
  );
}
