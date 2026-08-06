import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/intermed/AppShell";
import { StatCard } from "@/components/intermed/StatCard";
import { StatusBadge } from "@/components/intermed/StatusBadge";
import { api } from "@/lib/api";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — InterMed" },
      { name: "description", content: "Mapping success rate, average confidence and raw API call log." },
      { property: "og:title", content: "Analytics — InterMed" },
      { property: "og:description", content: "Mapping success rate, average confidence and raw API call log." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: api.analytics });

  return (
    <AppShell title="Analytics" subtitle="Engine performance and API usage">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mappings today" value={isLoading ? "—" : data!.mappingsToday} />
        <StatCard label="Total mappings" value={isLoading ? "—" : data!.totalMappings} />
        <StatCard label="Success rate" value={isLoading ? "—" : `${data!.successRate}%`} hint="Confident dual codes" />
        <StatCard label="Avg confidence" value={isLoading ? "—" : data!.avgConfidence} hint={data?.mostUsedDiagnosis ? `Top term: ${data.mostUsedDiagnosis}` : undefined} />
      </div>

      <div className="card-surface mt-4 p-5">
        <h2 className="text-sm font-semibold">Most-mapped diagnoses</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.diagnosisUsage ?? []} margin={{ left: -22, right: 8, top: 6 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" }}
              />
              <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-surface mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 text-sm font-semibold">API call log</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Query</th>
                <th className="px-5 py-2.5 font-medium">Resolved</th>
                <th className="px-5 py-2.5 font-medium">Confidence</th>
                <th className="px-5 py-2.5 font-medium">Source</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentApiCalls ?? []).map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3 font-medium">{r.query_text}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.diseases?.ayush_term ?? "—"}</td>
                  <td className="px-5 py-3 tabular-nums">{r.confidence_score}%</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.source}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}