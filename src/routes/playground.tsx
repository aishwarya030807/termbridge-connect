import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { AppShell } from "@/components/intermed/AppShell";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "API Playground — InterMed" },
      { name: "description", content: "Call the live InterMed REST endpoints and inspect raw JSON responses." },
      { property: "og:title", content: "API Playground — InterMed" },
      { property: "og:description", content: "Call the live InterMed REST endpoints and inspect raw JSON responses." },
    ],
  }),
  component: PlaygroundPage,
});

interface Endpoint {
  id: string;
  method: "GET" | "POST";
  path: string;
  summary: string;
  body?: string;
}

const ENDPOINTS: Endpoint[] = [
  { id: "health", method: "GET", path: "/api/public/health", summary: "Service + database health probe" },
  { id: "diseases", method: "GET", path: "/api/public/diseases", summary: "Full terminology catalogue" },
  { id: "suggest", method: "GET", path: "/api/public/suggest?q=madh", summary: "Autocomplete candidates" },
  {
    id: "map",
    method: "POST",
    path: "/api/public/map",
    summary: "Core mapping engine (fuzzy + synonym + phonetic)",
    body: JSON.stringify({ query: "Madhumeeha", persist: false }, null, 2),
  },
  { id: "patients", method: "GET", path: "/api/public/patients", summary: "Patient records with dual codes" },
  { id: "dashboard", method: "GET", path: "/api/public/dashboard", summary: "Aggregated dashboard metrics" },
  { id: "analytics", method: "GET", path: "/api/public/analytics", summary: "Usage analytics + API log" },
  { id: "openapi", method: "GET", path: "/api/public/openapi", summary: "OpenAPI 3.0.3 specification" },
];

function PlaygroundPage() {
  const [selected, setSelected] = useState<Endpoint>(ENDPOINTS[0]!);
  const [path, setPath] = useState(ENDPOINTS[0]!.path);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<{ code: number; ms: number } | null>(null);
  const [busy, setBusy] = useState(false);

  function pick(ep: Endpoint) {
    setSelected(ep);
    setPath(ep.path);
    setBody(ep.body ?? "");
    setResponse(null);
    setStatus(null);
  }

  async function send() {
    setBusy(true);
    const started = performance.now();
    try {
      const res = await fetch(path, {
        method: selected.method,
        headers: { "Content-Type": "application/json" },
        ...(selected.method === "POST" ? { body: body || "{}" } : {}),
      });
      const text = await res.text();
      setStatus({ code: res.status, ms: Math.round(performance.now() - started) });
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (e) {
      setStatus({ code: 0, ms: Math.round(performance.now() - started) });
      setResponse(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="API Playground" subtitle="Every screen in this console is powered by these endpoints">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card-surface overflow-hidden lg:col-span-2">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Endpoints</div>
          <ul className="divide-y divide-border">
            {ENDPOINTS.map((ep) => (
              <li key={ep.id}>
                <button
                  onClick={() => pick(ep)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-accent ${selected.id === ep.id ? "bg-accent" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`mono-code rounded px-1.5 py-0.5 text-[10px] font-bold ${ep.method === "GET" ? "bg-primary/12 text-primary" : "bg-success/15 text-success"}`}
                    >
                      {ep.method}
                    </span>
                    <span className="mono-code truncate text-xs">{ep.path}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{ep.summary}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <div className="card-surface p-4">
            <div className="flex gap-2">
              <span className="mono-code inline-flex h-10 items-center rounded-md border border-border bg-muted/50 px-2.5 text-xs font-bold">
                {selected.method}
              </span>
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="mono-code h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                onClick={send}
                disabled={busy}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Send
              </button>
            </div>

            {selected.method === "POST" ? (
              <div className="mt-3">
                <div className="text-xs font-medium text-muted-foreground">Request body</div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="mono-code mt-1.5 w-full rounded-md border border-input bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            ) : null}
          </div>

          <div className="card-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-semibold">Response</span>
              {status ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className={`mono-code rounded px-1.5 py-0.5 font-bold ${status.code >= 200 && status.code < 300 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {status.code || "ERR"}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{status.ms} ms</span>
                </span>
              ) : null}
            </div>
            <pre className="mono-code max-h-[26rem] overflow-auto p-4 text-[11px] leading-relaxed">
              {response ?? "// Send a request to see the raw JSON response"}
            </pre>
          </div>
        </div>
      </div>
    </AppShell>
  );
}