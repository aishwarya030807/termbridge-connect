export function CodeChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mono-code mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}