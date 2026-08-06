import { createFileRoute } from "@tanstack/react-router";
import { json, fail, preflight } from "@/lib/api-cors";

export const Route = createFileRoute("/api/public/diseases")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        try {
          const { loadDiseases } = await import("@/lib/intermed-db.server");
          const diseases = await loadDiseases();
          return json({ count: diseases.length, diseases });
        } catch (e) {
          return fail(e instanceof Error ? e.message : "failed", 500);
        }
      },
    },
  },
});