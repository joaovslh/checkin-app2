import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/checkin")({
  component: CheckIn,
});

type Presente = {
  id: string;
  nome: string;
  sala: string;
  entrada: string;
  alergias?: string;
};

type Cadastrada = {
  id: string;
  nome: string;
  sala: string;
  responsavel: string;
  alergias?: string;
};

const PRESENTES_INICIAIS: Presente[] = [
  { id: "p1", nome: "Alice Ribeiro Costa", sala: "Sala Girassol · 4-5 anos", entrada: "09:04", alergias: "Amendoim" },
  { id: "p2", nome: "Bento Almeida", sala: "Sala Sementinha · 2-3 anos", entrada: "09:07" },
  { id: "p3", nome: "Clara Nunes", sala: "Sala Girassol · 4-5 anos", entrada: "09:11", alergias: "Lactose" },
  { id: "p4", nome: "Davi Monteiro", sala: "Sala Oliveira · 6-8 anos", entrada: "09:15" },
];

const CADASTRO_GERAL: Cadastrada[] = [
  { id: "c1", nome: "Eloá Ferreira", sala: "Sala Sementinha · 2-3 anos", responsavel: "Marina Ferreira", alergias: "Ovo" },
  { id: "c2", nome: "Eduardo Lima", sala: "Sala Oliveira · 6-8 anos", responsavel: "Rafael Lima" },
  { id: "c3", nome: "Elisa Souza", sala: "Sala Girassol · 4-5 anos", responsavel: "Patrícia Souza" },
  { id: "c4", nome: "Enzo Rocha", sala: "Sala Oliveira · 6-8 anos", responsavel: "Tiago Rocha", alergias: "Glúten" },
];

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function CheckIn() {
  const [query, setQuery] = useState("");
  const [presentes, setPresentes] = useState<Presente[]>(PRESENTES_INICIAIS);

  const q = query.trim().toLowerCase();

  const presentesFiltrados = useMemo(() => {
    if (!q) return presentes;
    return presentes.filter((p) => p.nome.toLowerCase().includes(q));
  }, [q, presentes]);

  const idsPresentes = new Set(presentes.map((p) => p.nome.toLowerCase()));

  const cadastroSugestoes = useMemo(() => {
    if (!q) return [];
    return CADASTRO_GERAL.filter(
      (c) => c.nome.toLowerCase().includes(q) && !idsPresentes.has(c.nome.toLowerCase()),
    );
  }, [q, presentes]);

  const nadaEncontrado = q.length > 0 && presentesFiltrados.length === 0;

  function agora() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function fazerCheckin(c: Cadastrada) {
    setPresentes((prev) => [
      { id: c.id, nome: c.nome, sala: c.sala, entrada: agora(), alergias: c.alergias },
      ...prev,
    ]);
    setQuery("");
  }

  function fazerCheckout(id: string) {
    setPresentes((prev) => prev.filter((p) => p.id !== id));
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
              Check-in
            </h1>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Entrada e saída das crianças
            </p>
          </div>
          <div className="ml-auto hidden text-right sm:block">
            <p className="text-sm font-medium text-foreground">
              {presentes.length} presentes agora
            </p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Domingo · Culto das 10h
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar criança pelo nome"
            className="h-14 w-full rounded-xl border border-border bg-surface-elevated pl-12 pr-4 text-base text-foreground shadow-[var(--shadow-soft)] placeholder:text-muted-foreground focus:outline-none focus:shadow-[var(--shadow-focus)]"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          O reconhecimento facial chega em uma fase futura. Por enquanto, busque pelo nome.
        </p>

        {nadaEncontrado && (
          <section className="mt-8">
            <div className="rounded-xl border border-dashed border-border bg-surface p-5">
              <p className="text-sm font-medium text-foreground">
                Nenhuma criança presente com esse nome.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {cadastroSugestoes.length > 0
                  ? "Encontramos no cadastro geral. Confirme a entrada:"
                  : "Também não encontramos no cadastro geral. Verifique o nome ou faça um cadastro rápido."}
              </p>
            </div>

            {cadastroSugestoes.length > 0 && (
              <ul className="mt-4 space-y-3">
                {cadastroSugestoes.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-card)]"
                  >
                    <Avatar nome={c.nome} muted />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">{c.nome}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {c.sala} · Responsável: {c.responsavel}
                      </p>
                      {c.alergias && <AlergiaTag texto={c.alergias} />}
                    </div>
                    <button
                      type="button"
                      onClick={() => fazerCheckin(c)}
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                    >
                      Confirmar entrada
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {cadastroSugestoes.length === 0 && (
              <div className="mt-4">
                <Link
                  to="/cadastro"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                >
                  Fazer cadastro rápido
                </Link>
              </div>
            )}
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2
              className="text-xl font-semibold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Presentes agora
            </h2>
            <span className="text-sm text-muted-foreground">
              {presentesFiltrados.length} de {presentes.length}
            </span>
          </div>

          {presentesFiltrados.length === 0 && !nadaEncontrado && (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma criança fez check-in ainda.
            </p>
          )}

          <ul className="mt-4 space-y-3">
            {presentesFiltrados.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-card)]"
              >
                <Avatar nome={p.nome} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-foreground">{p.nome}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.sala} · Entrada às {p.entrada}
                  </p>
                  {p.alergias && <AlergiaTag texto={p.alergias} />}
                </div>
                <button
                  type="button"
                  onClick={() => fazerCheckout(p.id)}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                >
                  Check-out
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Avatar({ nome, muted }: { nome: string; muted?: boolean }) {
  return (
    <div
      aria-hidden
      className={
        "grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-semibold " +
        (muted
          ? "bg-surface text-muted-foreground ring-1 ring-inset ring-border"
          : "bg-accent text-primary")
      }
    >
      {initials(nome)}
    </div>
  );
}

function AlergiaTag({ texto }: { texto: string }) {
  return (
    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-emergency-border bg-emergency-surface px-2 py-0.5 text-[11px] font-medium text-foreground">
      <svg viewBox="0 0 24 24" className="h-3 w-3 text-emergency" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
      Alergia: {texto}
    </span>
  );
}