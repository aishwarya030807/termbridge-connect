import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Disease } from "./intermed-types";

export async function loadDiseases(): Promise<Disease[]> {
  const { data, error } = await supabaseAdmin
    .from("diseases")
    .select("*")
    .order("ayush_term");
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({
    ...d,
    synonyms: Array.isArray(d.synonyms) ? (d.synonyms as string[]) : [],
  })) as Disease[];
}

export { supabaseAdmin };