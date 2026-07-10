import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requireEquipeSession } from "../lib/auth-guard";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/painel")({
  beforeLoad: requireEquipeSession,
  component: Painel,
});

function Painel() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10 lg:py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Painel da equipe
          </p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Bom dia. O que você precisa fazer agora?
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Escolha uma área para começar. Você pode voltar aqui a qualquer momento.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <HubCard
            title="Check-in"
            description="Registrar entrada e saída das crianças."
            to="/checkin"
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="10" r="3" />
                <path d="M7 18c.7-2 2.6-3.2 5-3.2s4.3 1.2 5 3.2" />
              </svg>
            }
          />

          <HubCard
            title="Cadastro"
            description="Cadastrar novas crianças e famílias."
            to="/equipe-cadastro"
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 8v6" />
                <path d="M22 11h-6" />
              </svg>
            }
          />

          <HubCard
            title="Emergência"
            description="Chamar responsável durante o culto."
            critical
            to="/emergencia"
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            }
          />

          <HubCard
            title="Relatórios"
            description="Acompanhar presença e indicadores."
            to="/relatorios"
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 15l4-4 3 3 5-6" />
              </svg>
            }
          />
        </div>
      </main>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4 px-6 lg:px-10">
        <Link to="/painel" className="flex items-center gap-2.5 focus-visible:outline-none">
          <div
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </div>
          <span
            className="text-lg font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sela
          </span>
        </Link>

        <div className="mx-auto hidden min-w-0 flex-col items-center text-center sm:flex">
          <p className="truncate text-[13px] font-medium text-foreground">
            Igreja Virtude
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/"
            onClick={async (e) => {
              e.preventDefault();
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Sair
          </Link>
        </div>
      </div>
    </header>
  );
}

function HubCard({
  title,
  description,
  icon,
  critical,
  to,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  critical?: boolean;
  to?: string;
}) {
  const base =
    "group relative flex h-full flex-col justify-between gap-6 rounded-2xl border p-6 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]";

  const tone = critical
    ? "border-foreground/15 bg-surface-elevated ring-1 ring-inset ring-foreground/5 hover:border-foreground/25"
    : "border-border bg-surface-elevated hover:border-foreground/20";

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div
          aria-hidden
          className={
            "grid h-12 w-12 place-items-center rounded-xl " +
            (critical
              ? "bg-surface text-foreground ring-1 ring-inset ring-foreground/10"
              : "bg-accent text-primary")
          }
        >
          {icon}
        </div>
        {critical && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
            Função crítica
          </span>
        )}
      </div>

      <div>
        <h2
          className="text-xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition group-hover:text-foreground">
        Abrir
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 transition group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${base} ${tone}`}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={`${base} ${tone}`}>
      {content}
    </button>
  );
}