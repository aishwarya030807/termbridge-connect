import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/intermed/AppShell";
import { api } from "@/lib/api";

export const Route = createFileRoute("/patients/new")({
  head: () => ({
    meta: [
      { title: "New Patient — InterMed" },
      { name: "description", content: "Register a demo patient and attach a dual-coded AYUSH diagnosis." },
      { property: "og:title", content: "New Patient — InterMed" },
      { property: "og:description", content: "Register a demo patient and attach a dual-coded AYUSH diagnosis." },
    ],
  }),
  component: NewPatientPage,
});

function NewPatientPage() {
  const navigate = useNavigate();
  const diseases = useQuery({ queryKey: ["diseases"], queryFn: api.diseases });
  const [form, setForm] = useState({ name: "", age: "", gender: "Female", phone: "", department: "Ayurveda", diagnosisId: "" });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api.createPatient({
        name: form.name.trim(),
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        phone: form.phone.trim() || null,
        department: form.department,
        diagnosisId: form.diagnosisId || null,
      }),
    onSuccess: () => navigate({ to: "/patients" }),
    onError: (e) => setError((e as Error).message),
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const field = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";

  return (
    <AppShell title="New Patient" subtitle="Minimal intake — the point is the coded diagnosis">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (form.name.trim().length < 2) return setError("Enter a patient name.");
          create.mutate();
        }}
        className="card-surface max-w-2xl space-y-4 p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">Full name</label>
            <input id="name" value={form.name} maxLength={100} onChange={(e) => set("name", e.target.value)} className={field} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="age" className="text-sm font-medium">Age</label>
            <input id="age" type="number" min={0} max={130} value={form.age} onChange={(e) => set("age", e.target.value)} className={field} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="gender" className="text-sm font-medium">Gender</label>
            <select id="gender" value={form.gender} onChange={(e) => set("gender", e.target.value)} className={field}>
              <option>Female</option><option>Male</option><option>Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium">Phone</label>
            <input id="phone" value={form.phone} maxLength={20} onChange={(e) => set("phone", e.target.value)} className={field} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="dept" className="text-sm font-medium">Department</label>
            <select id="dept" value={form.department} onChange={(e) => set("department", e.target.value)} className={field}>
              <option>Ayurveda</option><option>Siddha</option><option>Unani</option><option>General Medicine</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="dx" className="text-sm font-medium">Diagnosis (dual-coded)</label>
            <select id="dx" value={form.diagnosisId} onChange={(e) => set("diagnosisId", e.target.value)} className={field}>
              <option value="">None</option>
              {(diseases.data?.diseases ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.ayush_term} · {d.namaste_code} · {d.icd11_tm2_code}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={create.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save patient
        </button>
      </form>
    </AppShell>
  );
}