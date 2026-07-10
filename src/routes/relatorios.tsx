import { createFileRoute, Link } from "@tanstack/react-router";
import { requireEquipeSession } from "../lib/auth-guard";

export const Route = createFileRoute("/relatorios")({
  beforeLoad: requireEquipeSession,
  component: Relatorios,
});

const STATS = [
  { label: "Check-ins hoje", value: "3" },
  { label: "Adoção do facial", value: "75%" },
  { label: "Sem facial cadastrado", value: "1" },
  { label: "Com alergias", value: "2" },
];

const SEMANA = [
  { dia: "Dom 1", checkins: 138 },
  { dia: "Dom 2", checkins: 145 },
  { dia: "Dom 3", checkins: 129 },
  { dia: "Dom 4", checkins: 152 },
  { dia: "Dom 5 (hoje)", checkins: 91 },
];

const METODOS = [
  { metodo: "Facial", pct: 68 },
  { metodo: "Manual/QR", pct: 32 },
];

function Relatorios() {
  const maxCheckins = Math.max(...SEMANA.map((d) => d.checkins));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-6 lg:px-10">
          <Link
            to="/painel"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Voltar
          </Link>
          <div className="ml-2">
            <h1
              className="text-lg font-semibold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Relatórios
            </h1>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Presença e indicadores
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-card)]"
            >
              <p className="text-2xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Check-ins nos últimos domingos
            </h2>
            <div className="mt-6 flex h-40 items-end gap-3">
              {SEMANA.map((d) => (
                <div key={d.dia} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={
                      "w-full rounded-t-md " +
                      (d.dia.includes("hoje") ? "bg-primary" : "bg-accent")
                    }
                    style={{ height: `${(d.checkins / maxCheckins) * 100}%` }}
                  />
                  <span className="text-center text-[10px] leading-tight text-muted-foreground">
                    {d.dia}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Método de check-in
            </h2>
            <div className="mt-6 space-y-4">
              {METODOS.map((m) => (
                <div key={m.metodo}>
                  <div className="mb-1 flex justify-between text-xs font-medium text-foreground">
                    <span>{m.metodo}</span>
                    <span>{m.pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className={m.metodo === "Facial" ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-accent"}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Quanto maior a adoção do facial, menor o tempo médio de fila — vale acompanhar como meta operacional.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
