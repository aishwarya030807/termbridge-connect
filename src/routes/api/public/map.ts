import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { json, fail, preflight } from "@/lib/api-cors";
import { mapQuery } from "@/lib/matching";

const BodySchema = z.object({
  query: z.string().trim().min(1, "query is required").max(200),
  patientId: z.string().uuid().nullish(),
  persist: z.boolean().optional().default(true),
  source: z.enum(["manual", "auto"]).optional().default("auto"),
});

export const Route = createFileRoute("/api/public/map")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const started = Date.now();
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return fail('Invalid JSON body. Expected { "query": "Madhumeha" }');
        }
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return fail(parsed.error.issues[0]?.message ?? "Invalid request body");
        }
        const { query, patientId, persist, source } = parsed.data;

        const { loadDiseases, supabaseAdmin } = await import("@/lib/intermed-db.server");
        const diseases = await loadDiseases();
        const result = mapQuery(query, diseases);
        result.elapsedMs = Date.now() - started;

        if (persist) {
          await supabaseAdmin.from("mappings").insert({
            disease_id: result.diseaseId,
            patient_id: patientId ?? null,
            query_text: query,
            confidence_score: result.confidence,
            status: result.status === "confirmed" ? "confirmed" : "pending",
            source,
            reason: result.reason,
          });
        }

        return json({
          ...result,
          disclaimer:
            "Demo/illustrative codes. NAMASTE and ICD-11 TM2 identifiers here are sample values, not official WHO/Ministry of Ayush releases.",
        });
      },
    },
  },
});