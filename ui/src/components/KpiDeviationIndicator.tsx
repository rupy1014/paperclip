const MAGNITUDE_STYLES: Record<string, { bar: string; label: string; text: string }> = {
  minor: {
    bar: "bg-yellow-400",
    label: "Minor",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  significant: {
    bar: "bg-orange-400",
    label: "Significant",
    text: "text-orange-700 dark:text-orange-300",
  },
  major: {
    bar: "bg-red-500",
    label: "Major",
    text: "text-red-700 dark:text-red-300",
  },
};

export function KpiDeviationIndicator({
  expected,
  actual,
  magnitude,
}: {
  expected: string;
  actual: string;
  magnitude: string;
}) {
  const style = MAGNITUDE_STYLES[magnitude] ?? MAGNITUDE_STYLES.minor;

  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Expected</span>
        <span className="text-muted-foreground">Actual</span>
      </div>
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{expected}</span>
        <span className={style.text}>{actual}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${style.bar}`}
            style={{ width: magnitude === "major" ? "100%" : magnitude === "significant" ? "66%" : "33%" }}
          />
        </div>
        <span className={`text-[10px] font-medium ${style.text}`}>{style.label}</span>
      </div>
    </div>
  );
}
