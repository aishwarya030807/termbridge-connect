export interface Disease {
  id: string;
  ayush_term: string;
  namaste_code: string;
  icd11_tm2_code: string;
  modern_equivalent: string;
  system_of_medicine: string;
  short_description: string;
  synonyms: string[];
}

export type MapStatus = "confirmed" | "low_confidence" | "no_confident_match";

export interface MapResult {
  status: MapStatus;
  query: string;
  diagnosis: string | null;
  diseaseId: string | null;
  namasteCode: string | null;
  tm2Code: string | null;
  equivalent: string | null;
  system: string | null;
  description: string | null;
  confidence: number;
  reason: string;
  suggestions: Suggestion[];
  elapsedMs?: number;
}

export interface Suggestion {
  diseaseId: string;
  diagnosis: string;
  namasteCode: string;
  tm2Code: string;
  equivalent: string;
  confidence: number;
  reason: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  department: string | null;
  diagnosis_id: string | null;
  created_at: string;
  diseases?: Disease | null;
}