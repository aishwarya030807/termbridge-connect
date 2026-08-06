import type { Disease, MapResult, Suggestion } from "./intermed-types";

/**
 * InterMed matching engine.
 *
 * Pure TypeScript, zero dependencies — runs identically on the edge server and
 * in tests. Combines three signals:
 *   1. exact match (normalised)
 *   2. "squeezed" phonetic match — collapses repeated letters so transliteration
 *      variants like "Madhumeeha" reduce to the same key as "Madhumeha"
 *   3. Levenshtein ratio + token-set ratio for everything else
 */

export const CONFIRM_THRESHOLD = 85;
export const SUGGEST_THRESHOLD = 55;

export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Collapse doubled letters: "madhumeeha" -> "madhumeha", "swaasa" -> "swasa" */
export function squeeze(input: string): string {
  return normalize(input).replace(/(.)\1+/g, "$1").replace(/\s/g, "");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    prev = curr;
  }
  return prev[b.length]!;
}

export function ratio(a: string, b: string): number {
  if (!a.length && !b.length) return 100;
  const max = Math.max(a.length, b.length);
  if (!max) return 0;
  return ((max - levenshtein(a, b)) / max) * 100;
}

/** Order-insensitive token comparison, e.g. "shwasa tamaka" vs "tamaka shwasa" */
export function tokenSetRatio(a: string, b: string): number {
  const at = new Set(normalize(a).split(" ").filter(Boolean));
  const bt = new Set(normalize(b).split(" ").filter(Boolean));
  if (!at.size || !bt.size) return 0;
  const inter = [...at].filter((t) => bt.has(t));
  const union = new Set([...at, ...bt]);
  const jaccard = (inter.length / union.size) * 100;
  return Math.max(jaccard, ratio([...at].sort().join(" "), [...bt].sort().join(" ")));
}

interface Scored {
  disease: Disease;
  score: number;
  reason: string;
}

function scoreCandidate(query: string, candidate: string, isSynonym: boolean): { score: number; reason: string } {
  const nq = normalize(query);
  const nc = normalize(candidate);
  const label = isSynonym ? `synonym '${candidate}'` : `AYUSH term '${candidate}'`;

  if (nq === nc) {
    return { score: 100, reason: `Exact match on ${label}` };
  }
  if (squeeze(query) === squeeze(candidate)) {
    return { score: 96, reason: `Spelling/transliteration variant of ${label}` };
  }
  if (nc.includes(nq) && nq.length >= 4) {
    return { score: 90, reason: `Prefix/partial match inside ${label}` };
  }

  const lev = ratio(nq, nc);
  const tok = tokenSetRatio(nq, nc);
  const score = Math.max(lev, tok * 0.97);
  const how = tok > lev ? "word-overlap" : "edit-distance";
  return { score, reason: `Fuzzy ${how} match against ${label} (${Math.round(score)}% similar)` };
}

export function scoreDisease(query: string, disease: Disease): { score: number; reason: string } {
  let best = scoreCandidate(query, disease.ayush_term, false);
  for (const syn of disease.synonyms ?? []) {
    const s = scoreCandidate(query, syn, true);
    if (s.score > best.score) best = s;
  }
  // secondary: modern equivalent, capped so it never beats a real term match
  const eq = scoreCandidate(query, disease.modern_equivalent, false);
  if (eq.score * 0.9 > best.score) {
    best = {
      score: eq.score * 0.9,
      reason: `Matched via modern equivalent '${disease.modern_equivalent}'`,
    };
  }
  return best;
}

export function rank(query: string, diseases: Disease[]): Scored[] {
  return diseases
    .map((disease) => {
      const { score, reason } = scoreDisease(query, disease);
      return { disease, score: Math.round(score), reason };
    })
    .sort((a, b) => b.score - a.score);
}

function toSuggestion(s: Scored): Suggestion {
  return {
    diseaseId: s.disease.id,
    diagnosis: s.disease.ayush_term,
    namasteCode: s.disease.namaste_code,
    tm2Code: s.disease.icd11_tm2_code,
    equivalent: s.disease.modern_equivalent,
    confidence: s.score,
    reason: s.reason,
  };
}

export function mapQuery(query: string, diseases: Disease[]): MapResult {
  const ranked = rank(query, diseases);
  const top = ranked[0];
  const suggestions = ranked.slice(0, 3).filter((s) => s.score >= SUGGEST_THRESHOLD).map(toSuggestion);

  if (!top || top.score < SUGGEST_THRESHOLD) {
    return {
      status: "no_confident_match",
      query,
      diagnosis: null,
      diseaseId: null,
      namasteCode: null,
      tm2Code: null,
      equivalent: null,
      system: null,
      description: null,
      confidence: top ? top.score : 0,
      reason: `No candidate crossed the ${SUGGEST_THRESHOLD}% confidence threshold for "${query}".`,
      suggestions: ranked.slice(0, 3).map(toSuggestion),
    };
  }

  const d = top.disease;
  return {
    status: top.score >= CONFIRM_THRESHOLD ? "confirmed" : "low_confidence",
    query,
    diagnosis: d.ayush_term,
    diseaseId: d.id,
    namasteCode: d.namaste_code,
    tm2Code: d.icd11_tm2_code,
    equivalent: d.modern_equivalent,
    system: d.system_of_medicine,
    description: d.short_description,
    confidence: top.score,
    reason: top.reason,
    suggestions: suggestions.slice(1),
  };
}

export function suggest(query: string, diseases: Disease[], limit = 5): Suggestion[] {
  return rank(query, diseases)
    .filter((s) => s.score >= SUGGEST_THRESHOLD)
    .slice(0, limit)
    .map(toSuggestion);
}