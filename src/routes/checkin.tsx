import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { requireEquipeSession } from "../lib/auth-guard";
import { IGREJA_ID, supabase } from "../lib/supabase";

export const Route = createFileRoute("/checkin")({
  beforeLoad: requireEquipeSession,
  component: CheckIn,
});

type Autorizado = {
  nome: string;
  parentesco: string | null;
};

type Presente = {
  checkinId: string;
  criancaId: string;
  nome: string;
  sala: string;
  entrada: string;
  alergias: string[] | null;
  codigo: string;
  responsavelNome: string;
  autorizados: Autorizado[];
  statusAprovacao: string;
};

type FilhoDisponivel = {
  id: string;
  nome: string;
  salaId: string | null;
  salaNome: string;
  alergias: string[] | null;
  statusAprovacao: string;
};

type ResponsavelComFilhos = {
  id: string;
  nome: string;
  telefone: string | null;
  filhos: FilhoDisponivel[];
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

function gerarCodigoPareado() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function CheckIn() {
  const [query, setQuery] = useState("");
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [responsaveis, setResponsaveis] = useState<ResponsavelComFilhos[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmacoes, setConfirmacoes] = useState<{ nome: string; codigo: string }[]>([]);
  const [ordemSalas, setOrdemSalas] = useState<Record<string, number>>({});
  const [expandido, setExpandido] = useState<string | null>(null);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);

    const [presentesRes, responsaveisRes] = await Promise.all([
      supabase
        .from("kids_checkins")
        .select(
          "id, entrada_em, codigo_pareado, crianca_id, kids_criancas(nome, alergias, status_aprovacao, kids_salas(nome), kids_responsaveis(nome), kids_autorizacoes_retirada(nome, parentesco))",
        )
        .is("saida_em", null)
        .order("entrada_em", { ascending: false }),
      supabase
        .from("kids_responsaveis")
        .select(
          "id, nome, telefone, kids_criancas(id, nome, sala_id, alergias, status_aprovacao, kids_salas(nome))",
        )
        .order("nome", { ascending: true }),
    ]);

    if (presentesRes.error || responsaveisRes.error) {
      setErro("Não foi possível carregar os dados de check-in.");
      setCarregando(false);
      return;
    }

    const presentesFormatados: Presente[] = (presentesRes.data ?? []).map((c: any) => ({
      checkinId: c.id,
      criancaId: c.crianca_id,
      nome: c.kids_criancas?.nome ?? "—",
      sala: c.kids_criancas?.kids_salas?.nome ?? "Sem sala",
      entrada: horaFormatada(c.entrada_em),
      alergias: c.kids_criancas?.alergias ?? null,
      codigo: c.codigo_pareado ?? "----",
      responsavelNome: c.kids_criancas?.kids_responsaveis?.nome ?? "—",
      autorizados: c.kids_criancas?.kids_autorizacoes_retirada ?? [],
      statusAprovacao: c.kids_criancas?.status_aprovacao ?? "aprovado",
    }));

    const responsaveisFormatados: ResponsavelComFilhos[] = (responsaveisRes.data ?? []).map((r: any) => ({
      id: r.id,
      nome: r.nome,
      telefone: r.telefone ?? null,
      filhos: (r.kids_criancas ?? []).map((f: any) => ({
        id: f.id,
        nome: f.nome,
        salaId: f.sala_id,
        salaNome: f.kids_salas?.nome ?? "Sem sala",
        alergias: f.alergias,
        statusAprovacao: f.status_aprovacao ?? "aprovado",
      })),
    }));

    setPresentes(presentesFormatados);
    setResponsaveis(responsaveisFormatados);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
    supabase
      .from("kids_salas")
      .select("nome")
      .order("faixa_etaria_min", { ascending: true })
      .then(({ data }) => {
        const mapa: Record<string, number> = {};
        (data ?? []).forEach((s, i) => (mapa[s.nome] = i));
        setOrdemSalas(mapa);
      });
  }, []);

  function agruparPorSala<T extends { sala: string }>(itens: T[]): { sala: string; itens: T[] }[] {
    const grupos = new Map<string, T[]>();
    for (const item of itens) {
      const lista = grupos.get(item.sala) ?? [];
      lista.push(item);
      grupos.set(item.sala, lista);
    }
    return Array.from(grupos.entries())
      .map(([sala, itens]) => ({ sala, itens }))
      .sort((a, b) => (ordemSalas[a.sala] ?? 99) - (ordemSalas[b.sala] ?? 99));
  }

  const q = query.trim().toLowerCase();

  const presentesFiltrados = useMemo(() => {
    if (!q) return presentes;
    return presentes.filter((p) => p.nome.toLowerCase().includes(q) || p.responsavelNome.toLowerCase().includes(q));
  }, [q, presentes]);

  const idsPresentes = new Set(presentes.map((p) => p.criancaId));

  // Busca por nome do RESPONSÁVEL — mostra ele e todos os filhos que
  // ainda não fizeram check-in hoje, pra seleção múltipla
  const responsaveisEncontrados = useMemo(() => {
    if (!q) return [];
    return responsaveis
      .filter((r) => r.nome.toLowerCase().includes(q))
      .map((r) => ({
        ...r,
        filhos: r.filhos.filter((f) => !idsPresentes.has(f.id)),
      }))
      .filter((r) => r.filhos.length > 0);
  }, [q, responsaveis, presentes]);

  const nadaEncontrado = q.length > 0 && presentesFiltrados.length === 0 && responsaveisEncontrados.length === 0;

  function alternarSelecao(filhoId: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(filhoId)) novo.delete(filhoId);
      else novo.add(filhoId);
      return novo;
    });
  }

  async function confirmarCheckins() {
    const todosFilhos = responsaveisEncontrados.flatMap((r) => r.filhos);
    const filhosSelecionados = todosFilhos.filter((f) => selecionados.has(f.id));
    if (filhosSelecionados.length === 0) return;

    setProcessando(true);
    setErro(null);

    const novosRegistros = filhosSelecionados.map((f) => ({
      igreja_id: IGREJA_ID,
      crianca_id: f.id,
      sala_id: f.salaId,
      codigo_pareado: gerarCodigoPareado(),
      metodo_entrada: "manual" as const,
    }));

    const { error } = await supabase.from("kids_checkins").insert(novosRegistros);

    if (error) {
      setErro("Não foi possível fazer o check-in. Tente novamente.");
    } else {
      setConfirmacoes(
        filhosSelecionados.map((f, i) => ({ nome: f.nome, codigo: novosRegistros[i].codigo_pareado })),
      );
      setQuery("");
      setSelecionados(new Set());
      await carregarDados();
    }
    setProcessando(false);
  }

  async function fazerCheckout(checkinId: string) {
    setProcessando(true);
    setErro(null);

    const { error } = await supabase
      .from("kids_checkins")
      .update({ saida_em: new Date().toISOString() })
      .eq("id", checkinId);

    if (error) {
      setErro("Não foi possível fazer o check-out. Tente novamente.");
    } else {
      await carregarDados();
    }
    setProcessando(false);
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
              {presentes.length} presente{presentes.length === 1 ? "" : "s"} agora
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
        {erro && (
          <div className="mb-6 rounded-md border border-emergency-border bg-emergency-surface px-4 py-3 text-sm text-foreground">
            {erro}
          </div>
        )}

        {confirmacoes.length > 0 && (
          <div className="mb-6 rounded-2xl border border-primary/30 bg-accent px-5 py-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-foreground">
                Check-in confirmado — anote ou informe os códigos, serão necessários na saída
              </p>
              <button
                type="button"
                onClick={() => setConfirmacoes([])}
                className="shrink-0 text-muted-foreground transition hover:text-foreground"
                aria-label="Fechar"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {confirmacoes.map((c, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-elevated px-3 py-2 shadow-[var(--shadow-soft)]">
                  <span className="text-sm font-medium text-foreground">{c.nome}</span>
                  <span
                    className="rounded-md bg-primary px-2.5 py-1 text-lg font-bold tracking-[0.15em] text-primary-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {c.codigo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
            onChange={(e) => {
              setQuery(e.target.value);
              setSelecionados(new Set());
            }}
            placeholder="Buscar pelo nome do responsável"
            className="h-14 w-full rounded-xl border border-border bg-surface-elevated pl-12 pr-4 text-base text-foreground shadow-[var(--shadow-soft)] placeholder:text-muted-foreground focus:outline-none focus:shadow-[var(--shadow-focus)]"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Busque pelo nome do responsável — se houver mais de um filho, todos aparecem para seleção.
        </p>

        {carregando && <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>}

        {!carregando && nadaEncontrado && (
          <section className="mt-8">
            <div className="rounded-xl border border-dashed border-border bg-surface p-5">
              <p className="text-sm font-medium text-foreground">
                Nenhum responsável encontrado com esse nome.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Verifique o nome ou faça um cadastro rápido.
              </p>
            </div>
            <div className="mt-4">
              <Link
                to="/equipe-cadastro"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              >
                Fazer cadastro rápido
              </Link>
            </div>
          </section>
        )}

        {!carregando && responsaveisEncontrados.length > 0 && (
          <section className="mt-8">
            <p className="text-sm font-medium text-foreground">Selecione quem vai fazer check-in:</p>
            <div className="mt-3 space-y-3">
              {responsaveisEncontrados.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-semibold text-foreground">
                    Responsável: {r.nome}
                    {r.telefone && <span className="ml-2 font-normal text-muted-foreground">· {r.telefone}</span>}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {r.filhos.map((f) => {
                      const marcado = selecionados.has(f.id);
                      return (
                        <li key={f.id}>
                          <button
                            type="button"
                            onClick={() => alternarSelecao(f.id)}
                            className={
                              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition " +
                              (marcado
                                ? "border-primary/40 bg-accent"
                                : "border-border bg-surface hover:border-foreground/20")
                            }
                          >
                            <span
                              className={
                                "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 " +
                                (marcado ? "border-primary bg-primary" : "border-border bg-surface-elevated")
                              }
                              aria-hidden
                            >
                              {marcado && (
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>
                              )}
                            </span>
                            <Avatar nome={f.nome} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{f.nome}</p>
                              <p className="truncate text-xs text-muted-foreground">{f.salaNome}</p>
                              {f.statusAprovacao === "pendente" && <PendenteTag />}
                              {f.alergias && f.alergias.length > 0 && <AlergiaTag texto={f.alergias.join(", ")} />}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={selecionados.size === 0 || processando}
              onClick={confirmarCheckins}
              className="mt-4 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
            >
              {processando
                ? "Confirmando..."
                : selecionados.size === 0
                  ? "Selecione ao menos 1 criança"
                  : `Confirmar entrada (${selecionados.size})`}
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
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

          {!carregando && presentesFiltrados.length === 0 && !nadaEncontrado && (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma criança fez check-in ainda.
            </p>
          )}

          <div className="mt-4 space-y-6">
            {agruparPorSala(presentesFiltrados).map((grupo) => (
              <div key={grupo.sala}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{grupo.sala}</h3>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {grupo.itens.length}
                  </span>
                </div>
                <ul className="space-y-3">
                  {grupo.itens.map((p) => (
                    <li
                      key={p.checkinId}
                      className="rounded-2xl border border-border bg-surface-elevated shadow-[var(--shadow-card)]"
                    >
                      <div className="flex items-center gap-4 p-4">
                        <Avatar nome={p.nome} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-foreground">{p.nome}</p>
                          <p className="truncate text-sm text-muted-foreground">Entrada às {p.entrada}</p>
                          {p.statusAprovacao === "pendente" && <PendenteTag />}
                          {p.alergias && p.alergias.length > 0 && <AlergiaTag texto={p.alergias.join(", ")} />}
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandido(expandido === p.checkinId ? null : p.checkinId)}
                          className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-secondary"
                        >
                          Retirada
                          <svg
                            viewBox="0 0 24 24"
                            className={"h-4 w-4 transition-transform " + (expandido === p.checkinId ? "rotate-180" : "")}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={processando}
                          onClick={() => fazerCheckout(p.checkinId)}
                          className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
                        >
                          {processando ? "..." : "Check-out"}
                        </button>
                      </div>

                      {expandido === p.checkinId && (
                        <div className="border-t border-border px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              Código do adesivo
                            </span>
                            <span
                              className="rounded-md bg-accent px-2.5 py-1 text-base font-bold tracking-[0.15em] text-primary"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {p.codigo}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-foreground">
                            <span className="font-medium">Responsável principal:</span> {p.responsavelNome}
                          </p>

                          <div className="mt-2">
                            <p className="text-sm font-medium text-foreground">Também autorizados a retirar:</p>
                            {p.autorizados.length === 0 ? (
                              <p className="mt-0.5 text-sm text-muted-foreground">Nenhuma pessoa extra cadastrada.</p>
                            ) : (
                              <ul className="mt-1 space-y-0.5">
                                {p.autorizados.map((a, i) => (
                                  <li key={i} className="text-sm text-muted-foreground">
                                    {a.nome}
                                    {a.parentesco ? ` (${a.parentesco})` : ""}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <p className="mt-3 text-xs text-muted-foreground">
                            Confira o código com quem está retirando antes de confirmar o check-out.
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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

function PendenteTag() {
  return (
    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
      Aprovação pendente
    </span>
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
