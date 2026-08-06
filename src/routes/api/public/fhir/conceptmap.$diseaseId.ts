import { createFileRoute } from "@tanstack/react-router";
import { json, fail, preflight } from "@/lib/api-cors";

export const Route = createFileRoute("/api/public/fhir/conceptmap/$diseaseId")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/lib/intermed-db.server");
        const { data: disease, error } = await supabaseAdmin
          .from("diseases")
          .select("*")
          .eq("id", params.diseaseId)
          .maybeSingle();
        if (error) return fail(error.message, 500);
        if (!disease) return fail("Disease not found", 404);

        const { data: maps } = await supabaseAdmin
          .from("concept_maps")
          .select("*")
          .eq("disease_id", disease.id);

        const groups = (maps ?? []).map((m) => ({
          source: m.source_system,
          target: m.target_system,
          element: [
            {
              code: disease.namaste_code,
              display: disease.ayush_term,
              target: [
                {
                  code: m.target_system.endsWith("/tm2") ? disease.icd11_tm2_code : "DEMO-BIO-EQV",
                  display: m.target_system.endsWith("/tm2")
                    ? `${disease.ayush_term} (TM2 pattern)`
                    : disease.modern_equivalent,
                  equivalence: m.equivalence,
                  comment: m.comment,
                },
              ],
            },
          ],
        }));

        return json({
          resourceType: "ConceptMap",
          id: `intermed-demo-${disease.id}`,
          url: `http://demo.intermed.in/fhir/ConceptMap/${disease.id}`,
          version: "1.0.0-demo",
          name: `InterMed_${disease.ayush_term.replace(/\s+/g, "_")}_Map`,
          title: `NAMASTE to ICD-11 TM2 mapping for ${disease.ayush_term} (demo)`,
          status: "draft",
          experimental: true,
          date: new Date().toISOString(),
          publisher: "InterMed (SIH prototype)",
          description: `${disease.short_description} Dual-coded illustrative mapping between a NAMASTE-style AYUSH concept and ICD-11 TM2 / biomedicine.`,
          purpose:
            "Demonstrates EHR Standards 2016 dual-coding: an AYUSH clinical term carried alongside an ICD-11 TM2 code inside a FHIR-shaped resource.",
          copyright:
            "ILLUSTRATIVE DEMO ONLY. Codes are sample values, not official WHO ICD-11 or Ministry of Ayush NAMASTE releases. This is not a certified FHIR terminology server.",
          sourceUri: "http://demo.intermed.in/fhir/CodeSystem/namaste",
          targetUri: "http://id.who.int/icd/release/11/mms/tm2",
          group: groups,
        });
      },
    },
  },
});