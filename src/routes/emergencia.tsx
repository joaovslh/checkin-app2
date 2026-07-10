import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/emergencia")({
  component: Emergencia,
});

type Crianca = {
  id: string;
  nome: string;
  sala: string;
  responsavel: string;
};

type Chamada = {
  id: string;
  criancaNome: string;
  responsavel: string;
  sala: string;
  status: "aberta" | "resolvida";
  abertaEm: string;
};

const PRESENTES: Crianca[] = [
  { id: "p1", nome: "Alice Ribeiro Costa", sala: "Sala Girassol", responsavel: "Camila Ferreira" },
  { id: "p2", nome: "Bento Almeida", sala: "Sala Sementinha", responsavel: "Rafael Souza" },
  { id: "p3", nome: "Clara Nunes", sala: "Sala Girassol", responsavel: "Patrícia Lima" },
  { id: "p4", nome: "Davi Monteiro", sala: "Sala Oliveira", responsavel: "Bruno Costa" },
];

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function agora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Emergencia() {
  const [selecionada, setSelecionada] = useState<Crianca | null>(null);
  const [chamadas, setChamadas] = useState<Chamada[]>([]);

  const chamadasAbertas = useMemo(
    () => chamadas.filter((c) => c.status === "aberta"),
    [chamadas],
  );

  function acionar(c: Crianca) {
    const nova: Chamada = {
      id: `${c.id}-${Date.now()}`,
      criancaNome: c.nome,
      responsavel: c.responsavel,
      sala: c.sala,
      status: "aberta",
      abertaEm: agora(),
    };
    setChamadas((prev) => [nova, ...prev]);
    setSelecionada(null);
  }

  function confirmarRetirada(id: string) {
    setChamadas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "resolvida" } : c)),
    );
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
              Emergência
            </h1>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Chamar responsável durante o culto
            </p>
          </div>
          {chamadasAbertas.length > 0 && (
            <div className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emergency-border bg-emergency-surface px-3 py-1.5 text-xs font-semibold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emergency" />
              {chamadasAbertas.length} chamada{chamadasAbertas.length > 1 ? "s" : ""} aberta{chamadasAbertas.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
        {chamadasAbertas.length > 0 && (
          <section className="mb-10 space-y-4">
            {chamadasAbertas.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-emergency-border bg-emergency-surface p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start gap-3">
                  <div
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emergency text-emergency-foreground"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-foreground">
                      Chamado de emergência — {c.sala}
                    </p>
                    <p className="mt-1 text-sm text-foreground/80">
                      {c.responsavel} foi acionado(a) às {c.abertaEm}. Aguardando retirada de {c.criancaNome} na porta da sala.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => confirmarRetirada(c.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-emergency px-4 text-sm font-semibold text-emergency-foreground shadow-[var(--shadow-soft)] transition hover:opacity-92 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                  >
                    Confirmar retirada
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                  >
                    Ligar para responsável
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        <section>
          <h2
            className="text-xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Selecione a criança
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A equipe da sala aciona o responsável em segundos, direto no WhatsApp — sem precisar de anúncio no salão.
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {PRESENTES.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelecionada(c)}
                  className={
                    "flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-[var(--shadow-card)] transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] " +
                    (selecionada?.id === c.id
                      ? "border-primary/40 bg-accent"
                      : "border-border bg-surface-elevated hover:border-foreground/20")
                  }
                >
                  <div
                    aria-hidden
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary"
                  >
                    {initials(c.nome)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{c.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.sala} · resp: {c.responsavel.split(" ")[0]}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {selecionada && (
          <section className="mt-8 rounded-2xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">
              Confirmar chamado de emergência para{" "}
              <span className="font-semibold text-foreground">{selecionada.responsavel}</span>,
              responsável por <span className="font-semibold text-foreground">{selecionada.nome}</span>.
              A mensagem vai por WhatsApp e notificação no app simultaneamente.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => acionar(selecionada)}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emergency px-4 text-sm font-semibold text-emergency-foreground shadow-[var(--shadow-soft)] transition hover:opacity-92 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              >
                Acionar agora
              </button>
              <button
                type="button"
                onClick={() => setSelecionada(null)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
