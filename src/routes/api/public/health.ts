import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/api-cors";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        const started = Date.now();
        let db = "unknown";
        let diseases = 0;
        try {
          const { loadDiseases } = await import("@/lib/intermed-db.server");
          diseases = (await loadDiseases()).length;
          db = "up";
        } catch {
          db = "down";
        }
        return json({
          status: db === "up" ? "ok" : "degraded",
          service: "InterMed Terminology Interoperability Engine",
          version: "1.0.0-demo",
          database: db,
          terminologyConcepts: diseases,
          latencyMs: Date.now() - started,
          timestamp: new Date().toISOString(),
        });
      },
    },
  },
});