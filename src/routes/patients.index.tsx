import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { AppShell } from "@/components/intermed/AppShell";
import { api } from "@/lib/api";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Patients — InterMed" },
      { name: "description", content: "Demo EMR patient records carrying NAMASTE and ICD-11 TM2 dual codes." },
      { property: "og:title", content: "Patients — InterMed" },
      { property: "og:description", content: "Demo EMR patient records carrying NAMASTE and ICD-11 TM2 dual codes." },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["patients"], queryFn: api.patients });

  return (
    <AppShell title="Patients" subtitle="Minimal EMR records — every diagnosis carries dual codes">
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">{data?.count ?? 0} records</h2>
          <Link to="/patients/new" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <UserPlus className="h-3.5 w-3.5" /> New patient
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Age / Gender</th>
                <th className="px-5 py-2.5 font-medium">Department</th>
                <th className="px-5 py-2.5 font-medium">Diagnosis</th>
                <th className="px-5 py-2.5 font-medium">NAMASTE</th>
                <th className="px-5 py-2.5 font-medium">TM2</th>
              </tr>
            </thead>
            <tbody>
              {(data?.patients ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.age ?? "—"} / {p.gender ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.department ?? "—"}</td>
                  <td className="px-5 py-3">{p.diseases?.ayush_term ?? "—"}</td>
                  <td className="mono-code px-5 py-3 text-xs">{p.diseases?.namaste_code ?? "—"}</td>
                  <td className="mono-code px-5 py-3 text-xs">{p.diseases?.icd11_tm2_code ?? "—"}</td>
                </tr>
              ))}
              {isLoading ? <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">Loading…</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}