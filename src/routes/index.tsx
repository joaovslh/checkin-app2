import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: Portal,
});

function SplashAbertura({ onFim }: { onFim: () => void }) {
  useEffect(() => {
    // Segurança: se o vídeo não tocar por algum motivo (autoplay
    // bloqueado, arquivo não carregou), não trava a pessoa aqui pra sempre.
    const timeout = setTimeout(onFim, 4000);
    return () => clearTimeout(timeout);
  }, [onFim]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background">
      <video
        src="/boas-vindas.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onFim}
        className="h-56 w-56 rounded-3xl object-cover shadow-[var(--shadow-card)]"
      />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex flex-col items-center">
      <img
        src="/logo-mascote.png"
        alt=""
        aria-hidden
        className="h-20 w-20 object-contain animate-[entradaLogo_0.7s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
        style={{ opacity: 0, transform: "scale(0.6) translateY(-12px)" }}
      />
      <style>{`
        @keyframes entradaLogo {
          from { opacity: 0; transform: scale(0.6) translateY(-12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function Portal() {
  const [mostrarSplash, setMostrarSplash] = useState(true);

  if (mostrarSplash) {
    return <SplashAbertura onFim={() => setMostrarSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-12 sm:py-16">
        <header className="flex flex-col items-center text-center">
          <Logo />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Check-in
          </p>
          <h1
            className="mt-1 text-4xl font-semibold tracking-tight text-foreground sm:text-[2.75rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Virtude Kids
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
            to="/responsavel"
            title="Sou responsável"
            description="Acesso rápido via WhatsApp, sem senha."
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
              </svg>
            }
          />
        </div>

        <div className="mt-10">
          <Link
            to="/cadastro"
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
          </Link>
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