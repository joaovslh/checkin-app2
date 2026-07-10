import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { requireEquipeSession } from "../lib/auth-guard";
import { IGREJA_ID, supabase } from "../lib/supabase";

export const Route = createFileRoute("/emergencia")({
  beforeLoad: requireEquipeSession,
  component: Emergencia,
});

type Presente = {
  criancaId: string;
  nome: string;
  sala: string;
  salaId: string | null;
  responsavelNome: string;
  responsavelTelefone: string | null;
};

type Chamada = {
  id: string;
  criancaNome: string;
  responsavelNome: string;
  responsavelTelefone: string | null;
  sala: string;
  abertaEm: string;
};

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function horaFormatada(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Emergencia() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [chamadasAbertas, setChamadasAbertas] = useState<Chamada[]>([]);
  const [selecionada, setSelecionada] = useState<Presente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [acionando, setAcionando] = useState(false);
  const [resolvendo, setResolvendo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);

    const [presentesRes, chamadasRes] = await Promise.all([
      supabase
        .from("kids_checkins")
        .select(
          "crianca_id, sala_id, kids_criancas(nome, kids_responsaveis(nome, telefone)), kids_salas(nome)",
        )
        .is("saida_em", null),
      supabase
        .from("kids_chamadas")
        .select(
          "id, aberta_em, kids_criancas(nome, kids_responsaveis(nome, telefone)), kids_salas(nome)",
        )
        .eq("status", "aberta")
        .order("aberta_em", { ascending: false }),
    ]);

    if (presentesRes.error || chamadasRes.error) {
      setErro("Não foi possível carregar os dados de emergência.");
      setCarregando(false);
      return;
    }

    setPresentes(
      (presentesRes.data ?? []).map((c: any) => ({
        criancaId: c.crianca_id,
        nome: c.kids_criancas?.nome ?? "—",
        sala: c.kids_salas?.nome ?? "Sem sala",
        salaId: c.sala_id,
        responsavelNome: c.kids_criancas?.kids_responsaveis?.nome ?? "—",
        responsavelTelefone: c.kids_criancas?.kids_responsaveis?.telefone ?? null,
      })),
    );

    setChamadasAbertas(
      (chamadasRes.data ?? []).map((c: any) => ({
        id: c.id,
        criancaNome: c.kids_criancas?.nome ?? "—",
        responsavelNome: c.kids_criancas?.kids_responsaveis?.nome ?? "—",
        responsavelTelefone: c.kids_criancas?.kids_responsaveis?.telefone ?? null,
        sala: c.kids_salas?.nome ?? "Sem sala",
        abertaEm: horaFormatada(c.aberta_em),
      })),
    );

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const idsComChamadaAberta = useMemo(
    () => new Set(chamadasAbertas.map((c) => c.criancaNome)),
    [chamadasAbertas],
  );

  async function acionar(p: Presente) {
    setAcionando(true);
    setErro(null);

    const { error } = await supabase.from("kids_chamadas").insert({
      igreja_id: IGREJA_ID,
      crianca_id: p.criancaId,
      sala_id: p.salaId,
      status: "aberta",
    });

    if (error) {
      setErro("Não foi possível acionar a emergência. Tente novamente.");
    } else {
      setSelecionada(null);
      await carregarDados();
    }
    setAcionando(false);
  }

  async function confirmarRetirada(id: string) {
    setResolvendo(id);
    setErro(null);

    const { error } = await supabase
      .from("kids_chamadas")
      .update({ status: "resolvida", resolvida_em: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setErro("Não foi possível confirmar a retirada. Tente novamente.");
    } else {
      await carregarDados();
    }
    setResolvendo(null);
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
        {erro && (
          <div className="mb-6 rounded-md border border-emergency-border bg-emergency-surface px-4 py-3 text-sm text-foreground">
            {erro}
          </div>
        )}

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
                      {c.responsavelNome} foi acionado(a) às {c.abertaEm}. Aguardando retirada de {c.criancaNome} na porta da sala.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={resolvendo === c.id}
                    onClick={() => confirmarRetirada(c.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-emergency px-4 text-sm font-semibold text-emergency-foreground shadow-[var(--shadow-soft)] transition hover:opacity-92 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
                  >
                    {resolvendo === c.id ? "Confirmando..." : "Confirmar retirada"}
                  </button>
                  {c.responsavelTelefone && (
                    <a
                      href={`tel:${c.responsavelTelefone}`}
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                    >
                      Ligar para responsável
                    </a>
                  )}
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

          {carregando && <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>}

          {!carregando && presentes.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma criança presente no momento. Faça o check-in primeiro.
            </p>
          )}

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {presentes
              .filter((p) => !idsComChamadaAberta.has(p.nome))
              .map((p) => (
                <li key={p.criancaId}>
                  <button
                    type="button"
                    onClick={() => setSelecionada(p)}
                    className={
                      "flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-[var(--shadow-card)] transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] " +
                      (selecionada?.criancaId === p.criancaId
                        ? "border-primary/40 bg-accent"
                        : "border-border bg-surface-elevated hover:border-foreground/20")
                    }
                  >
                    <div
                      aria-hidden
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary"
                    >
                      {initials(p.nome)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{p.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.sala} · resp: {p.responsavelNome.split(" ")[0]}
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
              <span className="font-semibold text-foreground">{selecionada.responsavelNome}</span>,
              responsável por <span className="font-semibold text-foreground">{selecionada.nome}</span>.
              A mensagem vai por WhatsApp e notificação no app simultaneamente.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={acionando}
                onClick={() => acionar(selecionada)}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emergency px-4 text-sm font-semibold text-emergency-foreground shadow-[var(--shadow-soft)] transition hover:opacity-92 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
              >
                {acionando ? "Acionando..." : "Acionar agora"}
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
