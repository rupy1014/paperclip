const CONFIDENCE_STYLES: Record<string, string> = {
  low: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  high: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function ConfidenceBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
        CONFIDENCE_STYLES[level] ?? CONFIDENCE_STYLES.medium
      }`}
    >
      {CONFIDENCE_LABELS[level] ?? level}
    </span>
  );
}
