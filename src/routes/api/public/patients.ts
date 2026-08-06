import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { json, fail, preflight } from "@/lib/api-cors";

const PatientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  age: z.coerce.number().int().min(0).max(130).nullish(),
  gender: z.string().trim().max(20).nullish(),
  phone: z.string().trim().max(30).nullish(),
  department: z.string().trim().max(80).nullish(),
  diagnosisId: z.string().uuid().nullish(),
});

export const Route = createFileRoute("/api/public/patients")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        const { supabaseAdmin } = await import("@/lib/intermed-db.server");
        const { data, error } = await supabaseAdmin
          .from("patients")
          .select("*, diseases(*)")
          .order("created_at", { ascending: false });
        if (error) return fail(error.message, 500);
        return json({ count: data?.length ?? 0, patients: data ?? [] });
      },
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return fail("Invalid JSON body");
        }
        const parsed = PatientSchema.safeParse(raw);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid patient");
        const p = parsed.data;

        const { supabaseAdmin } = await import("@/lib/intermed-db.server");
        const { data, error } = await supabaseAdmin
          .from("patients")
          .insert({
            name: p.name,
            age: p.age ?? null,
            gender: p.gender ?? null,
            phone: p.phone ?? null,
            department: p.department ?? null,
            diagnosis_id: p.diagnosisId ?? null,
          })
          .select("*, diseases(*)")
          .single();
        if (error) return fail(error.message, 500);

        if (p.diagnosisId) {
          await supabaseAdmin.from("mappings").insert({
            disease_id: p.diagnosisId,
            patient_id: data.id,
            query_text: data.diseases?.ayush_term ?? "",
            confidence_score: 100,
            status: "confirmed",
            source: "manual",
            reason: "Assigned during patient registration",
          });
        }
        return json({ patient: data }, 201);
      },
    },
  },
});