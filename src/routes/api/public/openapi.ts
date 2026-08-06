import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/api-cors";
import { openApiSpec } from "@/lib/openapi-spec";

export const Route = createFileRoute("/api/public/openapi")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => json(openApiSpec),
    },
  },
});