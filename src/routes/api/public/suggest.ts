import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/api-cors";
import { suggest } from "@/lib/matching";

export const Route = createFileRoute("/api/public/suggest")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 200);
        if (q.length < 2) return json({ query: q, suggestions: [] });
        const { loadDiseases } = await import("@/lib/intermed-db.server");
        const diseases = await loadDiseases();
        return json({ query: q, suggestions: suggest(q, diseases, 5) });
      },
    },
  },
});