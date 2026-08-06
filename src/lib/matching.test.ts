import { describe, expect, it } from "vitest";
import { mapQuery, suggest, CONFIRM_THRESHOLD } from "./matching";
import { SEED_DISEASES } from "./seed-data";
import type { Disease } from "./intermed-types";

const diseases: Disease[] = SEED_DISEASES.map((d, i) => ({ ...d, id: `id-${i}` }));

describe("InterMed /map fuzzy matching", () => {
  it("resolves an exact AYUSH term at full confidence", () => {
    const r = mapQuery("Madhumeha", diseases);
    expect(r.diagnosis).toBe("Madhumeha");
    expect(r.confidence).toBe(100);
    expect(r.status).toBe("confirmed");
    expect(r.namasteCode).toBe("NAM-AY-DEMO-0001");
    expect(r.tm2Code).toBe("TM2-DEMO-SA00");
  });

  it("resolves the misspelling 'Madhumeeha' to Madhumeha and says why", () => {
    const r = mapQuery("Madhumeeha", diseases);
    expect(r.diagnosis).toBe("Madhumeha");
    expect(r.confidence).toBeGreaterThanOrEqual(CONFIRM_THRESHOLD);
    expect(r.status).toBe("confirmed");
    expect(r.reason.toLowerCase()).toContain("madhumeha");
  });

  it("resolves the lay term 'Sugar Disease' via the synonym list", () => {
    const r = mapQuery("sugar disease", diseases);
    expect(r.diagnosis).toBe("Madhumeha");
    expect(r.equivalent).toBe("Type 2 Diabetes Mellitus");
    expect(r.reason).toMatch(/synonym/i);
  });

  it("is case- and order-insensitive on multi-word terms", () => {
    const r = mapQuery("SHWASA TAMAKA", diseases);
    expect(r.diagnosis).toBe("Tamaka Shwasa");
    expect(r.status).toBe("confirmed");
  });

  it("never hard-fails: gibberish returns no_confident_match plus suggestions", () => {
    const r = mapQuery("zzzqqqxyw", diseases);
    expect(r.status).toBe("no_confident_match");
    expect(r.diagnosis).toBeNull();
    expect(r.suggestions.length).toBeGreaterThan(0);
    expect(r.suggestions.length).toBeLessThanOrEqual(3);
  });

  it("suggest() ranks partial typing highest for the intended concept", () => {
    const s = suggest("madhu", diseases);
    expect(s[0]?.diagnosis).toBe("Madhumeha");
  });
});