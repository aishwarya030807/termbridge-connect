import type { MapResult, Patient, Suggestion } from "./intermed-types";

export const API_BASE = "/api/public";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database: string;
  terminologyConcepts: number;
  latencyMs: number;
}

export interface DashboardResponse {
  totalPatients: number;
  terminologyConcepts: number;
  mappingsGenerated: number;
  successfulMappings: number;
  pendingMappings: number;
  mappingsOverTime: { date: string; count: number }[];
  statusBreakdown: { name: string; value: number }[];
  recentDiagnoses: {
    id: string;
    name: string;
    created_at: string;
    diseases: { ayush_term: string; namaste_code: string; icd11_tm2_code: string; modern_equivalent: string } | null;
  }[];
  recentActivity: ActivityRow[];
}

export interface ActivityRow {
  id: string;
  query_text: string;
  status: string;
  confidence_score: number;
  source: string;
  reason: string;
  created_at: string;
  diseases: { ayush_term: string; namaste_code?: string; icd11_tm2_code?: string } | null;
}

export interface AnalyticsResponse {
  mappingsToday: number;
  totalMappings: number;
  mostUsedDiagnosis: string | null;
  mostUsedCount: number;
  successRate: number;
  avgConfidence: number;
  diagnosisUsage: { name: string; count: number }[];
  sourceBreakdown: { name: string; value: number }[];
  recentApiCalls: ActivityRow[];
}

export const api = {
  health: () => req<HealthResponse>("/health"),
  dashboard: () => req<DashboardResponse>("/dashboard"),
  analytics: () => req<AnalyticsResponse>("/analytics"),
  diseases: () => req<{ count: number; diseases: import("./intermed-types").Disease[] }>("/diseases"),
  patients: () => req<{ count: number; patients: Patient[] }>("/patients"),
  suggest: (q: string) => req<{ query: string; suggestions: Suggestion[] }>(`/suggest?q=${encodeURIComponent(q)}`),
  map: (body: { query: string; patientId?: string | null; persist?: boolean; source?: "manual" | "auto" }) =>
    req<MapResult & { disclaimer: string }>("/map", { method: "POST", body: JSON.stringify(body) }),
  createPatient: (body: Record<string, unknown>) =>
    req<{ patient: Patient }>("/patients", { method: "POST", body: JSON.stringify(body) }),
  conceptMap: (id: string) => req<Record<string, unknown>>(`/fhir/conceptmap/${id}`),
  reset: () => req<{ ok: boolean; message: string }>("/reset", { method: "POST" }),
};