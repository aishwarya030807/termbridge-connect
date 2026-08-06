export function ConfidenceRing({ value, size = 84 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const tone = value >= 85 ? "text-success" : value >= 55 ? "text-warning" : "text-destructive";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.max(0, Math.min(100, value))) / 100}
          className={`${tone} stroke-current transition-all duration-500`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tabular-nums">{Math.round(value)}</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">conf</span>
      </div>
    </div>
  );
}