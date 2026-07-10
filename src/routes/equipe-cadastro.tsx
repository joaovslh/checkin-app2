import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/equipe-cadastro")({
  component: EquipeCadastro,
});

type Crianca = {
  id: string;
  nome: string;
  idade: string;
  sala: string;
  responsavel: string;
  alergias?: string;
  facialStatus: "ativo" | "pendente" | "sem-facial";
};

const CRIANCAS: Crianca[] = [
  { id: "c1", nome: "Alice Ferreira", idade: "7 anos", sala: "Jardim", responsavel: "Camila Ferreira", alergias: "Amendoim", facialStatus: "ativo" },
  { id: "c2", nome: "Davi Souza", idade: "5 anos", sala: "Maternal", responsavel: "Rafael Souza", facialStatus: "ativo" },
  { id: "c3", nome: "Sarah Lima", idade: "8 anos", sala: "Kids", responsavel: "Patrícia Lima", alergias: "Leite, Ovo", facialStatus: "sem-facial" },
  { id: "c4", nome: "Noah Costa", idade: "10 anos", sala: "Pré-adolescentes", responsavel: "Bruno Costa", facialStatus: "pendente" },
];

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function EquipeCadastro() {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [autorizados, setAutorizados] = useState<string[]>([""]);

  function adicionarAutorizado() {
    if (autorizados.length >= 3) return;
    setAutorizados((prev) => [...prev, ""]);
  }

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
              Cadastro
            </h1>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Crianças e famílias · cadastro presencial
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarForm((v) => !v)}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Novo cadastro
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
        {mostrarForm && (
          <section className="mb-10 rounded-2xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Novo cadastro
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastro feito pela equipe, presencial. O reconhecimento facial é habilitado depois, em uma fase futura.
            </p>

            <form className="mt-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nome da criança">
                  <TextInput placeholder="Ex: Laura Mendonça" />
                </Field>
                <Field label="Data de nascimento">
                  <TextInput type="date" />
                </Field>
                <Field label="Sala">
                  <select className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none focus:border-ring focus:shadow-[var(--shadow-focus)]">
                    <option>Berçário</option>
                    <option>Maternal</option>
                    <option>Jardim</option>
                    <option>Kids</option>
                    <option>Pré-adolescentes</option>
                  </select>
                </Field>
                <Field label="Nome do responsável">
                  <TextInput placeholder="Ex: Ana Mendonça" />
                </Field>
                <Field label="WhatsApp do responsável">
                  <div className="flex h-11 items-stretch overflow-hidden rounded-md border border-input bg-surface-elevated shadow-[var(--shadow-soft)] focus-within:border-ring focus-within:shadow-[var(--shadow-focus)]">
                    <div className="flex items-center gap-2 border-r border-border bg-surface px-3 text-[15px] font-medium text-foreground">
                      <span aria-hidden>🇧🇷</span>
                      +55
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="(11) 91234-5678"
                      className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
                    />
                  </div>
                </Field>
                <Field label="Alergias" aside={<span className="text-xs font-medium text-muted-foreground">Opcional</span>}>
                  <TextInput placeholder="Ex: amendoim, lactose" />
                </Field>
              </div>

              <Field label="Observações" aside={<span className="text-xs font-medium text-muted-foreground">Opcional</span>}>
                <textarea
                  rows={2}
                  placeholder="Ex: usa óculos, não gosta de barulho alto"
                  className="w-full resize-none rounded-md border border-input bg-surface-elevated px-3 py-2.5 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:shadow-[var(--shadow-focus)]"
                />
              </Field>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Pessoas autorizadas a retirar</span>
                  <span className="text-xs font-medium text-muted-foreground">Até 3, além do responsável</span>
                </div>
                <div className="space-y-2.5">
                  {autorizados.map((_, i) => (
                    <div key={i} className="grid gap-2.5 sm:grid-cols-2">
                      <TextInput placeholder="Nome" />
                      <TextInput placeholder="Parentesco (ex: avó, tio)" />
                    </div>
                  ))}
                </div>
                {autorizados.length < 3 && (
                  <button
                    type="button"
                    onClick={adicionarAutorizado}
                    className="mt-2.5 text-sm font-medium text-foreground/80 underline underline-offset-4 decoration-border hover:text-foreground hover:decoration-foreground"
                  >
                    + adicionar outra pessoa autorizada
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/92 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                >
                  Salvar cadastro
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-5 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Crianças cadastradas
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {CRIANCAS.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start gap-3">
                  <div
                    aria-hidden
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary"
                  >
                    {initials(c.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{c.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.sala} · {c.idade} · resp: {c.responsavel}
                    </p>
                  </div>
                </div>
                {c.alergias && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emergency-border bg-emergency-surface px-2 py-0.5 text-[11px] font-medium text-foreground">
                    Alergia: {c.alergias}
                  </span>
                )}
                <div className="mt-3">
                  <FacialBadge status={c.facialStatus} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function FacialBadge({ status }: { status: Crianca["facialStatus"] }) {
  if (status === "ativo") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Facial ativo
      </span>
    );
  }
  if (status === "pendente") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/30" />
        Facial pendente — aguardando 1ª retirada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
      Sem facial — apenas manual
    </span>
  );
}

function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {aside}
      </div>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={
        "h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:shadow-[var(--shadow-focus)] " +
        className
      }
    />
  );
}
