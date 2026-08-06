import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/intermed/AppShell";
import { api } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — InterMed" },
      { name: "description", content: "Engine configuration, service health and demo data reset for InterMed." },
      { property: "og:title", content: "Settings — InterMed" },
      { property: "og:description", content: "Engine configuration, service health and demo data reset for InterMed." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reset() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.reset();
      setMsg(r.message);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Settings" subtitle="Service configuration and demo controls">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-surface p-5">
          <h2 className="text-sm font-semibold">Service</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Service", health.data?.service ?? "—"],
              ["Version", health.data?.version ?? "—"],
              ["Database", health.data?.database ?? "—"],
              ["Concepts loaded", String(health.data?.terminologyConcepts ?? "—")],
              ["Health latency", health.data ? `${health.data.latencyMs} ms` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card-surface p-5">
          <h2 className="text-sm font-semibold">Engine configuration</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Confidence threshold", "55%"],
              ["Auto-confirm threshold", "85%"],
              ["Matching strategy", "Exact → synonym → phonetic → Levenshtein + token-set"],
              ["Output format", "FHIR R4 ConceptMap"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Demo data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Restores the seeded terminology, patients and mapping log to a clean judge-ready state.
          </p>
          <button
            onClick={reset}
            disabled={busy}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Reset demo data
          </button>
          {msg ? <p className="mt-2 text-sm text-muted-foreground">{msg}</p> : null}
          <p className="mt-4 text-xs text-muted-foreground">
            Disclaimer: NAMASTE and ICD-11 TM2 identifiers in this prototype are illustrative sample values, not official
            WHO or Ministry of Ayush releases.
          </p>
        </div>
      </div>
    </AppShell>
  );
}