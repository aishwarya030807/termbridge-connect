import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/intermed/Logo";
import { getToken, signIn } from "@/lib/auth";
import { applyTheme, getStoredTheme } from "@/lib/theme";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ next: typeof s['next'] === "string" ? s['next'] : undefined }),
  head: () => ({
    meta: [
      { title: "InterMed — NAMASTE ⇄ ICD-11 TM2 Terminology Engine" },
      {
        name: "description",
        content:
          "InterMed maps AYUSH/NAMASTE diagnoses to ICD-11 TM2 codes and emits FHIR-shaped output for EHR-standards-compliant EMR systems.",
      },
      { property: "og:title", content: "InterMed — NAMASTE ⇄ ICD-11 TM2 Terminology Engine" },
      {
        property: "og:description",
        content: "Terminology interoperability engine bridging NAMASTE codes and ICD-11 Traditional Medicine Module 2.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [username, setUsername] = useState("dr.sharma");
  const [password, setPassword] = useState("demo1234");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(getStoredTheme());
    if (getToken()) navigate({ to: "/dashboard" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (username.trim().length < 3) return setError("Enter a username of at least 3 characters.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    signIn(username.trim(), remember);
    setTimeout(() => navigate({ to: (next as "/dashboard") ?? "/dashboard" }), 350);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/15">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">InterMed</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            NAMASTE ⇄ ICD-11 TM2, resolved in one API call.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
            A terminology interoperability engine for India's EHR Standards. Fuzzy diagnosis matching,
            dual coding, and FHIR ConceptMap output that drops into any existing EMR.
          </p>
          <div className="mono-code mt-8 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-4 text-xs">
            <div className="text-primary-foreground/60">POST /api/public/map</div>
            <div className="mt-1">{'{ "query": "Madhumeeha" }'}</div>
            <div className="mt-3 text-primary-foreground/60">→ 200 OK</div>
            <div>{'{ "namasteCode": "NAM-AY-DEMO-0001",'}</div>
            <div>{'  "tm2Code": "TM2-DEMO-SA00", "confidence": 100 }'}</div>
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">
          Prototype — codes are illustrative, not official WHO / Ministry of Ayush releases.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight lg:mt-0">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo clinician access to the InterMed EMR console.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                maxLength={64}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                maxLength={128}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
              Keep me signed in
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enter console
              {!busy ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Prefilled demo credentials. Auth is a client-side stub — the terminology API itself is fully live.
          </p>
        </div>
      </div>
    </div>
  );
}
