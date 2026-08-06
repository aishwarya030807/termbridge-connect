import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed match", cls: "bg-success/12 text-success border-success/30" },
  low_confidence: { label: "Low confidence", cls: "bg-warning/15 text-warning-foreground border-warning/40 dark:text-warning" },
  no_confident_match: { label: "No match", cls: "bg-destructive/12 text-destructive border-destructive/30" },
  pending: { label: "Pending", cls: "bg-warning/15 text-warning-foreground border-warning/40 dark:text-warning" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = MAP[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.cls,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}