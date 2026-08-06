import { createFileRoute } from "@tanstack/react-router";
import { json, fail, preflight } from "@/lib/api-cors";
import { SEED_DISEASES, SEED_PATIENTS } from "@/lib/seed-data";

export const Route = createFileRoute("/api/public/reset")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async () => {
        try {
          const { supabaseAdmin } = await import("@/lib/intermed-db.server");

          await supabaseAdmin.from("mappings").delete().not("id", "is", null);
          await supabaseAdmin.from("patients").delete().not("id", "is", null);
          await supabaseAdmin.from("concept_maps").delete().not("id", "is", null);
          await supabaseAdmin.from("diseases").delete().not("id", "is", null);

          const { data: diseases, error: dErr } = await supabaseAdmin
            .from("diseases")
            .insert(SEED_DISEASES)
            .select("*");
          if (dErr) return fail(dErr.message, 500);

          const byTerm = new Map((diseases ?? []).map((d) => [d.ayush_term, d]));

          await supabaseAdmin.from("concept_maps").insert(
            (diseases ?? []).flatMap((d) => [
              {
                disease_id: d.id,
                source_system: "http://demo.intermed.in/fhir/CodeSystem/namaste",
                target_system: "http://id.who.int/icd/release/11/mms/tm2",
                equivalence: "equivalent",
                comment: "Illustrative demo mapping - not official WHO/NAMASTE content",
              },
              {
                disease_id: d.id,
                source_system: "http://demo.intermed.in/fhir/CodeSystem/namaste",
                target_system: "http://id.who.int/icd/release/11/mms",
                equivalence: "relatedto",
                comment: "Biomedical equivalent concept (demo)",
              },
            ]),
          );

          const { data: patients } = await supabaseAdmin
            .from("patients")
            .insert(
              SEED_PATIENTS.map((p) => ({
                name: p.name,
                age: p.age,
                gender: p.gender,
                phone: p.phone,
                department: p.department,
                diagnosis_id: byTerm.get(p.term)?.id ?? null,
              })),
            )
            .select("*");

          const now = Date.now();
          await supabaseAdmin.from("mappings").insert([
            ...(patients ?? []).map((p, i) => ({
              disease_id: p.diagnosis_id,
              patient_id: p.id,
              query_text: SEED_PATIENTS[i]?.term ?? "",
              confidence_score: 100,
              status: "confirmed",
              source: "manual",
              reason: "Exact match on AYUSH term",
              created_at: new Date(now - (i + 1) * 86400000).toISOString(),
            })),
            {
              disease_id: byTerm.get("Madhumeha")?.id ?? null,
              query_text: "Sugar Disease",
              confidence_score: 100,
              status: "confirmed",
              source: "auto",
              reason: "Exact match on synonym 'Sugar Disease'",
              created_at: new Date(now - 2 * 86400000).toISOString(),
            },
            {
              disease_id: byTerm.get("Madhumeha")?.id ?? null,
              query_text: "Madhumeeha",
              confidence_score: 96,
              status: "confirmed",
              source: "auto",
              reason: "Spelling/transliteration variant of AYUSH term 'Madhumeha'",
              created_at: new Date(now - 86400000).toISOString(),
            },
            {
              disease_id: byTerm.get("Amlapitta")?.id ?? null,
              query_text: "acidity",
              confidence_score: 100,
              status: "confirmed",
              source: "auto",
              reason: "Exact match on synonym 'Acidity'",
              created_at: new Date(now - 3 * 86400000).toISOString(),
            },
          ]);

          return json({
            ok: true,
            message: "Demo data restored",
            diseases: diseases?.length ?? 0,
            patients: patients?.length ?? 0,
          });
        } catch (e) {
          return fail(e instanceof Error ? e.message : "reset failed", 500);
        }
      },
    },
  },
});