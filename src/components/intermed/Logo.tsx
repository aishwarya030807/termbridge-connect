import { Activity } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Activity className="h-4.5 w-4.5" strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">InterMed</div>
          <div className="text-[11px] text-muted-foreground">Terminology Engine</div>
        </div>
      )}
    </div>
  );
}