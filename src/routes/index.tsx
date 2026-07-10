import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Portal,
});

function Logo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        aria-hidden
        className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      </div>
    </div>
  );
}

function Portal() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-12 sm:py-16">
        <header className="flex flex-col items-center text-center">
          <Logo />
          <h1
            className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-[2.75rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sela
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Como você quer entrar?
          </p>
        </header>

        <div className="mt-12 flex flex-col gap-4">
          <EntryCard
            to="/equipe"
            title="Sou da equipe"
            description="Voluntários e líderes do ministério infantil."
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />

          <EntryCard
            title="Sou responsável"
            description="Acesso rápido via WhatsApp, sem senha."
            disabled
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
              </svg>
            }
          />
        </div>

        <div className="mt-10">
          <button
            type="button"
            className="group flex w-full items-center gap-4 rounded-xl border border-dashed border-border bg-transparent px-5 py-4 text-left transition hover:border-foreground/40 hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            <div
              aria-hidden
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-dashed border-border text-muted-foreground"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3" />
                <path d="M21 14v.01" />
                <path d="M14 21h.01" />
                <path d="M17 17h4v4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold text-foreground">
                Primeira vez aqui?
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Escaneie o QR da recepção para se cadastrar rapidamente.
              </p>
            </div>
          </button>
        </div>

        <footer className="mt-auto pt-16 text-center text-xs text-muted-foreground">
          <p>Dados protegidos conforme LGPD.</p>
        </footer>
      </div>
    </div>
  );
}

function EntryCard({
  to,
  title,
  description,
  icon,
  disabled,
}: {
  to?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div
        aria-hidden
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-primary"
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </>
  );

  const className =
    "group flex w-full items-center gap-4 rounded-2xl border border-border bg-surface-elevated px-5 py-5 text-left shadow-[var(--shadow-card)] transition hover:border-foreground/20 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]";

  if (to && !disabled) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className}>
      {content}
    </button>
  );
}