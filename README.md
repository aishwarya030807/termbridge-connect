# Term Bridge

Context: I'm building a working prototype for Smart India Hackathon (SIH),

problem statement: "Develop API code to integrate NAMASTE and/or ICD-11 via the

Traditional Medicine Module 2 (TM2) into existing EMR systems that comply with

India's EHR Standards."

Product name: InterMed.

This is a terminology INTEROPERABILITY ENGINE, not a hospital management system.

The EMR screens exist only to demonstrate the API — they should be minimal, not

gold-plated. All engineering effort goes to: the mapping/matching logic, the

REST API, and FHIR-shaped output.

Stack: React + TypeScript + TailwindCSS + shadcn/ui + React Router + Axios +

Recharts (frontend). FastAPI + Python + SQLAlchemy + PostgreSQL + OpenAPI

(backend). Design language: Vercel Dashboard / Linear / Stripe Dashboard —

white cards, blue accent, rounded corners, subtle shadow, no gradients, dark

mode support.

Work through the phases below IN ORDER — each phase depends on the previous

one (Phase 2's API needs Phase 1's schema live, Phase 4 needs Phase 2's /map

endpoint working, Phase 5 reuses components from Phase 3/4, Phase 6 is a

polish pass over everything). Don't skip ahead. After each phase, briefly

summarize what you built, flag any assumption you made instead of silently

picking one, and confirm it runs before moving to the next phase.

=====================================================================

PHASE 1 — Data model + seed data

=====================================================================

Design the PostgreSQL schema (via SQLAlchemy models) for InterMed:

- users (id, username, password_hash, role)

- diseases: our terminology mapping table. Columns: id, ayush_term (e.g.

  "Madhumeha"), namaste_code, icd11_tm2_code, modern_equivalent (e.g. "Type 2

  Diabetes Mellitus"), system_of_medicine (Ayurveda/Siddha/Unani), short

  description, synonyms (array/jsonb — include common misspellings and lay

  terms, e.g. "Madhumeeha", "Sugar Disease", "Honey Urine Disease")

- patients (id, name, age, gender, phone, department, diagnosis_id FK, created_at)

- mappings (id, disease_id FK, patient_id FK nullable, confidence_score,

  status [confirmed/pending], source [manual/auto], created_at) — this is the

  audit log of every mapping ever generated, powers the analytics page

Seed diseases with at least these 4, fully filled in with plausible NAMASTE and

ICD-11 TM2 style codes (clearly labeled as demo/sample codes, not official WHO

data — do not fabricate real WHO ICD-11 codes and present them as authoritative):

Madhumeha, Amlapitta, Ardhavabhedaka, Tamaka Shwasa.

Also stub a `concept_maps` table shaped loosely like a FHIR ConceptMap (source

system, target system, equivalence) — used in Phase 5 to produce a

FHIR-flavored JSON response. Don't build a full FHIR server, just enough

structure to shape realistic output.

Deliver: SQLAlchemy models + an Alembic-free seed script (simple Python script

using the session) that populates demo data. Run the seed script and confirm

the tables are populated before moving to Phase 2.

=====================================================================

PHASE 2 — Core mapping engine + REST API

=====================================================================

Build the FastAPI backend for InterMed on top of the Phase 1 schema.

Endpoints:

- POST /patients

- GET /patients

- POST /map  — body: { "query": string }. This is the core engine:

    1. Try exact match against ayush_term (case-insensitive)

    2. Try fuzzy match against ayush_term + synonyms (use rapidfuzz or

       difflib — pick one, tell me your choice and why)

    3. If nothing crosses a confidence threshold, return a 200 with

       status "no_confident_match" and up to 3 nearest suggestions —

       never a bare 404 for this endpoint, the frontend needs something

       to show

    4. Return: diagnosis, namasteCode, tm2Code, equivalent, confidence

       (0-100), reason (short human-readable explanation of WHY it matched,

       e.g. "matched via synonym 'Sugar Disease'"), status

    5. Log every call to the mappings table

- GET /dashboard — aggregate counts for the dashboard cards

- GET /analytics — mappings today, most-used diagnosis, success rate,

  avg confidence, recent API calls

- GET /health

- GET /fhir/conceptmap/{disease_id} — return a FHIR-ConceptMap-shaped JSON

  (resourceType, group, element, target with equivalence) built from the

  concept_maps + diseases tables. Label it clearly as a demo/illustrative

  FHIR shape, not a certified FHIR server.

Add OpenAPI docs with real example request/response bodies (this doubles as

the API Playground data source in Phase 4). CORS open for local dev. Write

3-4 pytest tests for the /map fuzzy-matching logic specifically — that's the

part a judge will stress-test live. Start the server and confirm /health and

/map return correct JSON before moving to Phase 3.

=====================================================================

PHASE 3 — Frontend shell + auth + dashboard

=====================================================================

Build the React + TypeScript frontend shell:

- Login page: hospital branding placeholder, username/password, remember me,

  dummy auth (accept any non-empty credentials, store a fake token, redirect

  to dashboard)

- Sidebar layout: Dashboard, Patients, New Patient, Diagnosis Mapping,

  API Playground, Analytics, Settings — persistent across routes via

  React Router, collapsible on mobile

- Dashboard page wired to GET /dashboard and GET /analytics:

    cards for Total Patients, Mappings Generated, Successful Mappings,

    Pending Mappings, API Status (green dot if /health responds)

    Recharts line chart: mappings over time

    Recharts pie chart: mapped vs pending

    Recent Diagnoses list, Recent Activity feed

Design: white cards, subtle border + shadow, blue-600 accent, Inter font,

generous whitespace, dark mode via Tailwind class strategy. No gradients.

Use shadcn/ui components (Card, Badge, Button, Table, Input) rather than

building these primitives from scratch.

=====================================================================

PHASE 4 — Diagnosis Mapping page + API Playground

=====================================================================

Build two pages that both hit POST /map:

1. Diagnosis Mapping page (doctor-facing):

   - Search input with debounced autocomplete as the doctor types

     (call /map or a lightweight /suggest variant on each keystroke after

     2+ chars, show top 3-5 candidates in a dropdown)

   - On select, call /map and render a result card showing: Diagnosis,

     NAMASTE Code, TM2 Code, Equivalent Modern Concept, Confidence Score

     (as a progress ring or bar), Explanation text, Status badge

     (color-coded: green=confirmed match, amber=low confidence, red=no match)

   - "Save Mapping" button — POST to persist it against a selected patient

     (or as a standalone mapping if no patient selected)

   - Also demo the fuzzy path explicitly: typing "Madhumeeha" or

     "Sugar Disease" should visibly still resolve to Madhumeha with the

     explanation showing which synonym matched — this is the single most

     important interaction in the whole app, make it feel snappy and obvious

2. API Playground page (developer-facing):

   - Free-text diagnosis input

   - "Run" button calls POST /map for real (not mocked)

   - Syntax-highlighted JSON response viewer (raw response, not reformatted)

   - Show the equivalent curl command and the request latency

   - This page proves the API is real, not a UI mockup — make that obvious

=====================================================================

PHASE 5 — Patients, New Patient, FHIR preview, Settings, Analytics polish

=====================================================================

Fill out the remaining pages, keep these intentionally lighter than Phase 4:

- Patients: searchable table (Name, Age, Gender, Diagnosis, NAMASTE Code,

  TM2 Code, Status, View button), wired to GET /patients

- New Patient: form (Name, Age, Gender, Phone, Department, Diagnosis Search

  reusing the Phase 4 autocomplete component), POST /patients, then on

  success show a FHIR-preview modal/panel — call GET /fhir/conceptmap/{id}

  and render the JSON, labeled "FHIR-compatible preview (demo)"

- Analytics: Mappings Today, Most Used Diagnosis, Success Rate, Avg Confidence,

  Hospital Usage, Recent API Calls table, 1-2 Recharts visualizations, all

  wired to GET /analytics

- Settings: Hospital Name, FHIR Export Toggle, Theme (light/dark), API Key

  (generate a fake one, show copy button), System Version — all client-side

  state is fine here, no backend persistence needed

=====================================================================

PHASE 6 — Judge-readiness pass

=====================================================================

Do a final pass focused on demo reliability, not new features:

- Add a seed/reset script or button so the demo data can be restored in one

  click before a live demo

- Confirm the fuzzy-match demo path ("Madhumeeha" -> Madhumeha,

  "Sugar Disease" -> Madhumeha) works end to end after a fresh seed

- Add a one-page README: how to run backend + frontend locally, what's

  real vs illustrative (be explicit: seed codes are demo data, not official

  WHO/NAMASTE codes; FHIR output is illustrative shape, not certified),

  and a short "why this matters" paragraph tying it back to the problem

  statement (EHR Standards 2016, ABHA/consent, dual-coding)

- Check responsive behavior at mobile width and confirm dark mode doesn't

  break any chart or badge contrast

- List any known gaps out loud so I can decide what to fix vs mention as

  future work in the pitch

=====================================================================

Work through Phases 1 through 6 in order, checking in briefly after each

phase with what you built and what you assumed, then continue to the next

phase automatically unless I interrupt.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a6da6bd1-d313-406b-924c-1f327c045586).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
