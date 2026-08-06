import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Database, GitCompareArrows, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/intermed/AppShell";
import { StatCard } from "@/components/intermed/StatCard";
import { StatusBadge } from "@/components/intermed/StatusBadge";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InterMed" },
      { name: "description", content: "Live mapping volume, dual-coding coverage and recent terminology activity." },
      { property: "og:title", content: "Dashboard — InterMed" },
      { property: "og:description", content: "Live mapping volume, dual-coding coverage and recent terminology activity." },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)", "var(--chart-2)"];

function DashboardPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  return (
    <AppShell title="Dashboard" subtitle="NAMASTE ⇄ ICD-11 TM2 interoperability at a glance">
      {error ? (
        <div className="card-surface p-6 text-sm text-destructive">Could not load dashboard: {(error as Error).message}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patients" value={isLoading ? "—" : data!.totalPatients} icon={Users} hint="Records in demo EMR" />
        <StatCard label="Terminology concepts" value={isLoading ? "—" : data!.terminologyConcepts} icon={Database} hint="NAMASTE ⇄ TM2 pairs loaded" />
        <StatCard label="Mappings generated" value={isLoading ? "—" : data!.mappingsGenerated} icon={GitCompareArrows} hint="Total engine resolutions" />
        <StatCard
          label="Dual-coded"
          value={isLoading ? "—" : data!.successfulMappings}
          icon={Activity}
          hint={isLoading ? undefined : `${data!.pendingMappings} awaiting clinician review`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Mapping volume · last 7 days</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.mappingsOverTime ?? []} margin={{ left: -22, right: 8, top: 6 }}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} fill="url(#vol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="text-sm font-semibold">Match confidence split</h2>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.statusBreakdown ?? []} dataKey="value" nameKey="name" innerRadius={44} outerRadius={66} paddingAngle={3}>
                  {(data?.statusBreakdown ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5">
            {(data?.statusBreakdown ?? []).map((s, i) => (
              <li key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.name}
                </span>
                <span className="font-medium tabular-nums">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Recent engine activity</h2>
          <Link to="/mapping" className="text-xs font-medium text-primary hover:underline">
            Map a diagnosis →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Query</th>
                <th className="px-5 py-2.5 font-medium">Resolved term</th>
                <th className="px-5 py-2.5 font-medium">NAMASTE</th>
                <th className="px-5 py-2.5 font-medium">TM2</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentActivity ?? []).map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3 font-medium">{r.query_text}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.diseases?.ayush_term ?? "—"}</td>
                  <td className="mono-code px-5 py-3 text-xs">{r.diseases?.namaste_code ?? "—"}</td>
                  <td className="mono-code px-5 py-3 text-xs">{r.diseases?.icd11_tm2_code ?? "—"}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {!isLoading && (data?.recentActivity ?? []).length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">No mappings yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}