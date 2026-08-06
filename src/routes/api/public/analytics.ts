import { createFileRoute } from "@tanstack/react-router";
import { json, fail, preflight } from "@/lib/api-cors";

export const Route = createFileRoute("/api/public/analytics")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        const { supabaseAdmin } = await import("@/lib/intermed-db.server");
        const { data, error } = await supabaseAdmin
          .from("mappings")
          .select(
            "id, query_text, status, confidence_score, source, reason, created_at, diseases(ayush_term, namaste_code, icd11_tm2_code)",
          )
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) return fail(error.message, 500);
        const rows = data ?? [];
        const today = new Date().toISOString().slice(0, 10);
        const mappingsToday = rows.filter((r) => String(r.created_at).slice(0, 10) === today).length;
        const confirmed = rows.filter((r) => r.status === "confirmed").length;

        const counts = new Map<string, number>();
        for (const r of rows) {
          const t = r.diseases?.ayush_term;
          if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
        }
        const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);

        const bySource = new Map<string, number>();
        for (const r of rows) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);

        return json({
          mappingsToday,
          totalMappings: rows.length,
          mostUsedDiagnosis: ranked[0]?.[0] ?? null,
          mostUsedCount: ranked[0]?.[1] ?? 0,
          successRate: rows.length ? Math.round((confirmed / rows.length) * 100) : 0,
          avgConfidence: rows.length
            ? Math.round(rows.reduce((s, r) => s + (r.confidence_score ?? 0), 0) / rows.length)
            : 0,
          diagnosisUsage: ranked.slice(0, 6).map(([name, count]) => ({ name, count })),
          sourceBreakdown: [...bySource.entries()].map(([name, value]) => ({ name, value })),
          recentApiCalls: rows.slice(0, 15),
        });
      },
    },
  },
});