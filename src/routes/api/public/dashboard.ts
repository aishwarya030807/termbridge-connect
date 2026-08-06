import { createFileRoute } from "@tanstack/react-router";
import { json, fail, preflight } from "@/lib/api-cors";

export const Route = createFileRoute("/api/public/dashboard")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        const { supabaseAdmin } = await import("@/lib/intermed-db.server");
        const [patients, mappings, diseases] = await Promise.all([
          supabaseAdmin
            .from("patients")
            .select("id, name, created_at, diseases(ayush_term, namaste_code, icd11_tm2_code, modern_equivalent)")
            .order("created_at", { ascending: false }),
          supabaseAdmin
            .from("mappings")
            .select("id, query_text, status, confidence_score, source, reason, created_at, diseases(ayush_term)")
            .order("created_at", { ascending: false }),
          supabaseAdmin.from("diseases").select("id"),
        ]);
        if (patients.error || mappings.error || diseases.error) {
          return fail(
            patients.error?.message ?? mappings.error?.message ?? diseases.error?.message ?? "query failed",
            500,
          );
        }
        const rows = mappings.data ?? [];
        const confirmed = rows.filter((r) => r.status === "confirmed").length;

        const byDay = new Map<string, number>();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          byDay.set(d, 0);
        }
        for (const r of rows) {
          const d = String(r.created_at).slice(0, 10);
          if (byDay.has(d)) byDay.set(d, byDay.get(d)! + 1);
        }

        return json({
          totalPatients: patients.data?.length ?? 0,
          terminologyConcepts: diseases.data?.length ?? 0,
          mappingsGenerated: rows.length,
          successfulMappings: confirmed,
          pendingMappings: rows.length - confirmed,
          mappingsOverTime: [...byDay.entries()].map(([date, count]) => ({ date, count })),
          statusBreakdown: [
            { name: "Confirmed", value: confirmed },
            { name: "Pending", value: rows.length - confirmed },
          ],
          recentDiagnoses: (patients.data ?? []).slice(0, 5),
          recentActivity: rows.slice(0, 8),
        });
      },
    },
  },
});