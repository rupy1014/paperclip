import { Clock } from "lucide-react";

function getUrgency(deadline: string | Date): "overdue" | "urgent" | "normal" {
  const due = new Date(deadline);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "urgent";
  return "normal";
}

const URGENCY_STYLES = {
  overdue: "text-red-600 dark:text-red-400",
  urgent: "text-amber-600 dark:text-amber-400",
  normal: "text-muted-foreground",
};

export function DeadlineLabel({ deadline }: { deadline: string | Date }) {
  const urgency = getUrgency(deadline);
  const label =
    urgency === "overdue"
      ? "Overdue"
      : `Due ${new Date(deadline).toLocaleDateString()}`;

  return (
    <span className={`text-xs flex items-center gap-1 ${URGENCY_STYLES[urgency]}`}>
      {urgency !== "normal" && <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}
