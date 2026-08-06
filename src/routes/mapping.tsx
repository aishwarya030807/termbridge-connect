import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Check, FileJson, Loader2, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/intermed/AppShell";
import { StatusBadge } from "@/components/intermed/StatusBadge";
import { CodeChip } from "@/components/intermed/CodeChip";
import { ConfidenceRing } from "@/components/intermed/ConfidenceRing";
import { api } from "@/lib/api";
import type { MapResult, Suggestion } from "@/lib/intermed-types";

export const Route = createFileRoute("/mapping")({
  head: () => ({
    meta: [
      { title: "Diagnosis Mapping — InterMed" },
      { name: "description", content: "Type an AYUSH diagnosis and resolve it to NAMASTE and ICD-11 TM2 dual codes." },
      { property: "og:title", content: "Diagnosis Mapping — InterMed" },
      { property: "og:description", content: "Type an AYUSH diagnosis and resolve it to NAMASTE and ICD-11 TM2 dual codes." },
    ],
  }),
  component: MappingPage,
});

const EXAMPLES = ["Madhumeeha", "Sugar Disease", "Amlapitta", "Tamakaa Shwaasa", "Ardhavabhedaka"];

function MappingPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [patientId, setPatientId] = useState("");
  const [persist, setPersist] = useState(false);
  const [result, setResult] = useState<MapResult | null>(null);
  const [showFhir, setShowFhir] = useState(false);
  const [fhir, setFhir] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const patients = useQuery({ queryKey: ["patients"], queryFn: api.patients });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const suggestions = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: () => api.suggest(debounced),
    enabled: debounced.length >= 2 && !result,
  });

  const mapMut = useMutation({
    mutationFn: (q: string) =>
      api.map({ query: q, patientId: persist && patientId ? patientId : null, persist, source: "manual" }),
    onSuccess: (r) => {
      setResult(r);
      setFhir(null);
      setShowFhir(false);
    },
  });

  function run(q?: string) {
    const value = (q ?? query).trim();
    if (value.length < 2) return;
    setQuery(value);
    mapMut.mutate(value);
  }

  async function loadFhir(id: string) {
    const doc = await api.conceptMap(id);
    setFhir(JSON.stringify(doc, null, 2));
    setShowFhir(true);
  }

  return (
    <AppShell title="Diagnosis Mapping" subtitle="Free-text AYUSH term → NAMASTE + ICD-11 TM2 dual coding">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card-surface p-5 lg:col-span-3">
          <label htmlFor="dx" className="text-sm font-medium">Diagnosis term</label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="dx"
              ref={inputRef}
              value={query}
              maxLength={120}
              placeholder="e.g. Madhumeeha, Sugar Disease, Amlapitta…"
              onChange={(e) => {
                setQuery(e.target.value);
                setResult(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && run()}
              className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-28 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button
              onClick={() => run()}
              disabled={mapMut.isPending || query.trim().length < 2}
              className="absolute right-1.5 top-1.5 inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {mapMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Map
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => run(ex)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {ex}
              </button>
            ))}
          </div>

          {!result && suggestions.data && suggestions.data.suggestions.length > 0 ? (
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-md border border-border">
              {suggestions.data.suggestions.map((s: Suggestion) => (
                <li key={s.diseaseId}>
                  <button onClick={() => run(s.diagnosis)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent">
                    <span>
                      <span className="font-medium">{s.diagnosis}</span>
                      <span className="mono-code ml-2 text-xs text-muted-foreground">{s.namasteCode}</span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">{s.confidence}%</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5 space-y-2 border-t border-border pt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} className="h-4 w-4 accent-primary" />
              Persist this mapping to a patient record
            </label>
            {persist ? (
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Log only (no patient)</option>
                {(patients.data?.patients ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : null}
          </div>

          {mapMut.error ? <p className="mt-3 text-sm text-destructive">{(mapMut.error as Error).message}</p> : null}
        </div>

        <div className="lg:col-span-2">
          {!result ? (
            <div className="card-surface flex h-full min-h-64 flex-col items-center justify-center p-8 text-center">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Enter a diagnosis to see its NAMASTE code, ICD-11 TM2 code and biomedical equivalent.
              </p>
            </div>
          ) : (
            <div className="card-surface p-5">
              <div className="flex items-start gap-4">
                <ConfidenceRing value={result.confidence} />
                <div className="min-w-0">
                  <StatusBadge status={result.status} />
                  <h2 className="mt-2 truncate text-lg font-semibold tracking-tight">{result.diagnosis ?? "Unmapped"}</h2>
                  <p className="text-xs text-muted-foreground">{result.reason}</p>
                </div>
              </div>

              {result.diseaseId ? (
                <>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <CodeChip label="NAMASTE" value={result.namasteCode!} />
                    <CodeChip label="ICD-11 TM2" value={result.tm2Code!} />
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Biomedical equivalent</dt>
                      <dd className="text-right font-medium">{result.equivalent}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">System</dt>
                      <dd className="font-medium">{result.system}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Latency</dt>
                      <dd className="tabular-nums font-medium">{result.elapsedMs ?? 0} ms</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{result.description}</p>

                  <button
                    onClick={() => (showFhir ? setShowFhir(false) : loadFhir(result.diseaseId!))}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <FileJson className="h-4 w-4" />
                    {showFhir ? "Hide FHIR ConceptMap" : "View FHIR ConceptMap"}
                  </button>
                  {showFhir && fhir ? (
                    <pre className="mono-code mt-3 max-h-72 overflow-auto rounded-md border border-border bg-muted/50 p-3 text-[11px] leading-relaxed">
                      {fhir}
                    </pre>
                  ) : null}
                  {persist ? (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-success">
                      <Check className="h-3.5 w-3.5" /> Mapping persisted to the audit log.
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Closest candidates:</p>
                  <ul className="mt-2 divide-y divide-border overflow-hidden rounded-md border border-border">
                    {result.suggestions.map((s) => (
                      <li key={s.diseaseId}>
                        <button onClick={() => run(s.diagnosis)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-accent">
                          <span className="font-medium">{s.diagnosis}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">{s.confidence}%</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}