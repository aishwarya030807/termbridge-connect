export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "InterMed Terminology Interoperability API",
    version: "1.0.0-demo",
    description:
      "Maps AYUSH (NAMASTE-style) clinical terms to ICD-11 TM2 and biomedical equivalents for EMR systems compliant with India's EHR Standards 2016. All codes returned are illustrative demo values, not official WHO/Ministry of Ayush releases.",
  },
  servers: [{ url: "/api/public", description: "InterMed demo server" }],
  paths: {
    "/health": {
      get: {
        summary: "Service health",
        responses: {
          "200": {
            description: "Service is up",
            content: {
              "application/json": {
                example: {
                  status: "ok",
                  service: "InterMed Terminology Interoperability Engine",
                  version: "1.0.0-demo",
                  database: "up",
                  terminologyConcepts: 4,
                },
              },
            },
          },
        },
      },
    },
    "/map": {
      post: {
        summary: "Map a free-text diagnosis to NAMASTE + ICD-11 TM2 codes",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: { query: "Sugar Disease", patientId: null, persist: true },
            },
          },
        },
        responses: {
          "200": {
            description: "Always 200 — a low/no-confidence query returns suggestions instead of a 404",
            content: {
              "application/json": {
                example: {
                  status: "confirmed",
                  query: "Sugar Disease",
                  diagnosis: "Madhumeha",
                  namasteCode: "NAM-AY-DEMO-0001",
                  tm2Code: "TM2-DEMO-SA00",
                  equivalent: "Type 2 Diabetes Mellitus",
                  confidence: 100,
                  reason: "Exact match on synonym 'Sugar Disease'",
                  suggestions: [],
                },
              },
            },
          },
        },
      },
    },
    "/suggest": {
      get: {
        summary: "Lightweight autocomplete (min 2 chars, does not write to the audit log)",
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" }, example: "madhu" }],
        responses: {
          "200": {
            description: "Ranked candidates",
            content: {
              "application/json": {
                example: {
                  query: "madhu",
                  suggestions: [
                    { diagnosis: "Madhumeha", namasteCode: "NAM-AY-DEMO-0001", confidence: 90 },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/patients": {
      get: { summary: "List patients with their mapped diagnosis", responses: { "200": { description: "OK" } } },
      post: {
        summary: "Register a patient",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                name: "Ramesh Iyer",
                age: 54,
                gender: "Male",
                phone: "+91 98200 11223",
                department: "General Medicine",
                diagnosisId: "uuid-of-disease",
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/diseases": { get: { summary: "Full demo terminology set", responses: { "200": { description: "OK" } } } },
    "/dashboard": { get: { summary: "Dashboard aggregate counts", responses: { "200": { description: "OK" } } } },
    "/analytics": { get: { summary: "Usage analytics", responses: { "200": { description: "OK" } } } },
    "/fhir/conceptmap/{diseaseId}": {
      get: {
        summary: "FHIR ConceptMap-shaped output (illustrative, not a certified FHIR server)",
        parameters: [{ name: "diseaseId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "ConceptMap resource",
            content: {
              "application/json": {
                example: {
                  resourceType: "ConceptMap",
                  status: "draft",
                  experimental: true,
                  group: [
                    {
                      source: "http://demo.intermed.in/fhir/CodeSystem/namaste",
                      target: "http://id.who.int/icd/release/11/mms/tm2",
                      element: [
                        {
                          code: "NAM-AY-DEMO-0001",
                          display: "Madhumeha",
                          target: [{ code: "TM2-DEMO-SA00", equivalence: "equivalent" }],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/reset": {
      post: {
        summary: "Restore demo data to a known-good state before a live demo",
        responses: { "200": { description: "Reseeded" } },
      },
    },
  },
} as const;