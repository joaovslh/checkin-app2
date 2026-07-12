import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { registrarMomentoDoLogin } from "../lib/auth-guard";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/equipe")({
  component: Index,
});

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src="/logo-mascote.png" alt="" aria-hidden className="h-11 w-11 object-contain" />
      <div className="flex flex-col leading-none">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Check-in
        </span>
        <span className="mt-0.5 font-display text-[1.35rem] font-semibold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Virtude Kids
        </span>
      </div>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-10 lg:py-16">
        <LoginPanel />
      </div>
    </div>
  );
}

/* ---------- Splash / login institucional (equipe) ---------- */

function LoginPanel() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("E-mail ou senha incorretos. Confira e tente novamente.");
      return;
    }

    registrarMomentoDoLogin();
    navigate({ to: "/painel" });
  }

  return (
    <section className="flex flex-col">
      <Logo />

      <div className="mt-16 max-w-md">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Acesso da equipe
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-[2.75rem]" style={{ fontFamily: "var(--font-display)" }}>
          Check-in do ministério infantil.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Entre com a conta da sua igreja para iniciar a sala do dia, acompanhar presença e responder a chamados de emergência.
        </p>

        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          <Field label="E-mail" htmlFor="email">
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@igreja.org"
              className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:shadow-[var(--shadow-focus)]"
            />
          </Field>

          <Field
            label="Senha"
            htmlFor="password"
            aside={
              <a href="#" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                Esqueci minha senha
              </a>
            }
          >
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:shadow-[var(--shadow-focus)]"
            />
          </Field>

          {error && (
            <p className="rounded-md border border-emergency-border bg-emergency-surface px-3 py-2 text-sm text-foreground">
              {error}
            </p>
          )}

          <div className="pt-2">
            <PrimaryButton className="w-full" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </PrimaryButton>
          </div>

          <p className="pt-2 text-center text-sm text-muted-foreground">
            É um responsável, não da equipe?{" "}
            <a href="#" className="font-medium text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground">
              Baixar o app do responsável
            </a>
          </p>
        </form>
      </div>

      <footer className="mt-auto pt-16 text-xs text-muted-foreground">
        <p>Dados protegidos conforme LGPD. Sessão da equipe expira automaticamente após 8h.</p>
      </footer>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {aside}
      </div>
      {children}
    </label>
  );
}

/* ---------- Componentes primitivos ---------- */

function PrimaryButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={
        "inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-[15px] font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition " +
        "hover:bg-primary/92 active:bg-primary/88 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50 " +
        className
      }
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={
        "inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface-elevated px-5 text-[15px] font-medium text-foreground transition " +
        "hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] " +
        className
      }
    >
      {children}
    </button>
  );
}
