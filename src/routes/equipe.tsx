import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      </div>
      <span className="font-display text-[1.35rem] font-semibold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
        Sela
      </span>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10 lg:py-16">
        <LoginPanel />
        <PreviewPanel />
      </div>
    </div>
  );
}

/* ---------- Splash / login institucional (equipe) ---------- */

function LoginPanel() {
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

        <form className="mt-10 space-y-5" onSubmit={(e) => e.preventDefault()}>
          <Field label="Igreja" htmlFor="church">
            <select
              id="church"
              className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none transition focus:border-ring focus:shadow-[var(--shadow-focus)]"
              defaultValue="ibrb"
            >
              <option value="ibrb">Igreja Batista da Redenção — Botafogo</option>
              <option value="c1">Comunidade Cristã Central</option>
            </select>
          </Field>

          <Field label="E-mail" htmlFor="email">
            <input
              id="email"
              type="email"
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
              placeholder="••••••••"
              className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:shadow-[var(--shadow-focus)]"
            />
          </Field>

          <div className="pt-2">
            <PrimaryButton className="w-full">Entrar</PrimaryButton>
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

/* ---------- Preview de componentes ---------- */

function PreviewPanel() {
  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-16 lg:self-start">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Design system — v0
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Componentes base
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Amostras para validar tom, cor e densidade antes das telas de fluxo.
        </p>
      </div>

      {/* Botões */}
      <PreviewBlock label="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton>Iniciar check-in</PrimaryButton>
          <SecondaryButton>Cancelar</SecondaryButton>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Primário para ação principal única por tela. Secundário para escape ou ação neutra.
        </p>
      </PreviewBlock>

      {/* Card padrão */}
      <PreviewBlock label="Card padrão — criança na sala">
        <ChildCard />
      </PreviewBlock>

      {/* Alerta de emergência */}
      <PreviewBlock label="Estado de emergência">
        <EmergencyAlert />
        <p className="mt-3 text-xs text-muted-foreground">
          Vermelho é reservado a este estado. Não usar em avisos comuns, validações de formulário ou confirmação.
        </p>
      </PreviewBlock>
    </aside>
  );
}

function PreviewBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5">{children}</div>
    </div>
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

function ChildCard() {
  return (
    <article className="rounded-xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-[15px] font-semibold text-primary"
        >
          LM
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-foreground">
                Laura Mendonça
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                4 anos · Sala Girassóis · Retirar com Ana Mendonça
              </p>
            </div>
            <StatusPill>Na sala</StatusPill>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Tag tone="warning">Alergia: amendoim</Tag>
            <Tag>Uso de inalador</Tag>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </span>
  );
}

function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning";
}) {
  const styles =
    tone === "warning"
      ? "border-[color:var(--color-emergency-border)] bg-[color:var(--color-emergency-surface)] text-[color:var(--color-emergency)]"
      : "border-border bg-surface text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}

function EmergencyAlert() {
  return (
    <div
      role="alert"
      className="rounded-xl border p-4"
      style={{
        backgroundColor: "var(--color-emergency-surface)",
        borderColor: "var(--color-emergency-border)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: "var(--color-emergency)", color: "var(--color-emergency-foreground)" }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[15px] font-semibold" style={{ color: "var(--color-emergency)" }}>
            Chamado de emergência — Sala Girassóis
          </h4>
          <p className="mt-1 text-sm text-foreground">
            Ana Mendonça (mãe de Laura) foi acionada agora. Aguardando retirada na porta da sala.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-[color:var(--color-emergency-foreground)] transition"
              style={{ backgroundColor: "var(--color-emergency)" }}
            >
              Confirmar retirada
            </button>
            <button className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface-elevated px-4 text-sm font-medium text-foreground transition hover:bg-secondary">
              Ligar para responsável
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
