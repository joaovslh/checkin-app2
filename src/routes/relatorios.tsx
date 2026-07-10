import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { requireEquipeSession } from "../lib/auth-guard";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/relatorios")({
  beforeLoad: requireEquipeSession,
  component: Relatorios,
});

// Grade fixa de cultos da Igreja Virtude: dia da semana (0=domingo) -> horários
const HORARIOS_CULTO: Record<number, string[]> = {
  0: ["09:00", "11:00", "18:30"], // domingo
  3: ["20:00"], // quarta-feira
};

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type CheckinRow = {
  id: string;
  crianca_id: string;
  entrada_em: string;
  saida_em: string | null;
  nome: string;
};

type ChamadaRow = {
  crianca_id: string;
  aberta_em: string;
};

type Culto = {
  id: string; // "2026-07-06_09:00"
  data: string; // "2026-07-06"
  horario: string; // "09:00"
  label: string; // "Domingo, 06/07 · 09:00"
};

function dataLocalStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function horaLocalStr(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function encontrarCulto(iso: string): Culto | null {
  const d = new Date(iso);
  const diaSemana = d.getDay();
  const horarios = HORARIOS_CULTO[diaSemana];
  if (!horarios || horarios.length === 0) return null;

  const minutosEntrada = d.getHours() * 60 + d.getMinutes();
  let melhor = horarios[0];
  let menorDiff = Infinity;
  for (const h of horarios) {
    const [hh, mm] = h.split(":").map(Number);
    const diff = Math.abs(hh * 60 + mm - minutosEntrada);
    if (diff < menorDiff) {
      menorDiff = diff;
      melhor = h;
    }
  }

  const data = dataLocalStr(d);
  const [ano, mes, dia] = data.split("-").map(Number);
  const diaLabel = DIAS_SEMANA[new Date(ano, mes - 1, dia).getDay()];
  const dataFormatada = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`;

  return {
    id: `${data}_${melhor}`,
    data,
    horario: melhor,
    label: `${diaLabel}, ${dataFormatada} · ${melhor}`,
  };
}

function mesLabel(chave: string) {
  const [ano, mes] = chave.split("-").map(Number);
  const nomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${nomes[mes - 1]} de ${ano}`;
}

function Relatorios() {
  const [aba, setAba] = useState<"culto" | "mes">("culto");
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [chamadas, setChamadas] = useState<ChamadaRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cultoSelecionado, setCultoSelecionado] = useState<string | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro(null);

      const [checkinsRes, chamadasRes] = await Promise.all([
        supabase
          .from("kids_checkins")
          .select("id, crianca_id, entrada_em, saida_em, kids_criancas(nome)")
          .order("entrada_em", { ascending: false }),
        supabase.from("kids_chamadas").select("crianca_id, aberta_em"),
      ]);

      if (checkinsRes.error || chamadasRes.error) {
        setErro("Não foi possível carregar os dados de relatório.");
        setCarregando(false);
        return;
      }

      setCheckins(
        (checkinsRes.data ?? []).map((c: any) => ({
          id: c.id,
          crianca_id: c.crianca_id,
          entrada_em: c.entrada_em,
          saida_em: c.saida_em,
          nome: c.kids_criancas?.nome ?? "—",
        })),
      );
      setChamadas(
        (chamadasRes.data ?? []).map((c: any) => ({
          crianca_id: c.crianca_id,
          aberta_em: c.aberta_em,
        })),
      );
      setCarregando(false);
    }
    carregar();
  }, []);

  // ---------- Agrupamento por culto ----------
  const cultos = useMemo(() => {
    const mapa = new Map<string, Culto>();
    for (const c of checkins) {
      const culto = encontrarCulto(c.entrada_em);
      if (culto && !mapa.has(culto.id)) mapa.set(culto.id, culto);
    }
    return Array.from(mapa.values()).sort((a, b) => b.id.localeCompare(a.id));
  }, [checkins]);

  useEffect(() => {
    if (!cultoSelecionado && cultos.length > 0) setCultoSelecionado(cultos[0].id);
  }, [cultos, cultoSelecionado]);

  const detalheCulto = useMemo(() => {
    if (!cultoSelecionado) return [];
    return checkins
      .filter((c) => encontrarCulto(c.entrada_em)?.id === cultoSelecionado)
      .map((c) => {
        const teveEmergencia = chamadas.some(
          (ch) => ch.crianca_id === c.crianca_id && encontrarCulto(ch.aberta_em)?.id === cultoSelecionado,
        );
        const entradaD = new Date(c.entrada_em);
        return {
          id: c.id,
          nome: c.nome,
          entrada: horaLocalStr(entradaD),
          saida: c.saida_em ? horaLocalStr(new Date(c.saida_em)) : null,
          emergencia: teveEmergencia,
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cultoSelecionado, checkins, chamadas]);

  // ---------- Agrupamento por mês ----------
  const meses = useMemo(() => {
    const set = new Set<string>();
    for (const c of checkins) {
      const d = new Date(c.entrada_em);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [checkins]);

  useEffect(() => {
    if (!mesSelecionado && meses.length > 0) setMesSelecionado(meses[0]);
  }, [meses, mesSelecionado]);

  const statsMes = useMemo(() => {
    if (!mesSelecionado) return null;

    const checkinsDoMes = checkins.filter((c) => {
      const d = new Date(c.entrada_em);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return chave === mesSelecionado;
    });

    const cultosDoMesSet = new Set<string>();
    for (const c of checkinsDoMes) {
      const culto = encontrarCulto(c.entrada_em);
      if (culto) cultosDoMesSet.add(culto.id);
    }

    const criancasUnicas = new Set(checkinsDoMes.map((c) => c.crianca_id));

    const chamadasDoMes = chamadas.filter((ch) => {
      const d = new Date(ch.aberta_em);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return chave === mesSelecionado;
    });

    const totalCultos = cultosDoMesSet.size;
    const mediaCriancasPorCulto = totalCultos > 0 ? (checkinsDoMes.length / totalCultos).toFixed(1) : "0";

    // contagem por culto, para o gráfico de barras
    const porCulto = new Map<string, { label: string; total: number }>();
    for (const c of checkinsDoMes) {
      const culto = encontrarCulto(c.entrada_em);
      if (!culto) continue;
      const atual = porCulto.get(culto.id);
      if (atual) atual.total += 1;
      else porCulto.set(culto.id, { label: culto.label, total: 1 });
    }
    const barrasCultos = Array.from(porCulto.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    return {
      totalCheckins: checkinsDoMes.length,
      criancasUnicas: criancasUnicas.size,
      totalCultos,
      mediaCriancasPorCulto,
      totalEmergencias: chamadasDoMes.length,
      barrasCultos,
    };
  }, [mesSelecionado, checkins, chamadas]);

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
              Relatórios
            </h1>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Presença e indicadores
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

        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setAba("culto")}
            className={
              "rounded-md px-4 py-2 text-sm font-medium transition " +
              (aba === "culto" ? "bg-surface-elevated text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground")
            }
          >
            Por culto
          </button>
          <button
            type="button"
            onClick={() => setAba("mes")}
            className={
              "rounded-md px-4 py-2 text-sm font-medium transition " +
              (aba === "mes" ? "bg-surface-elevated text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground")
            }
          >
            Por mês
          </button>
        </div>

        {carregando && <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>}

        {!carregando && aba === "culto" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-1.5">
              {cultos.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum check-in registrado ainda.</p>
              )}
              {cultos.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCultoSelecionado(c.id)}
                  className={
                    "block w-full rounded-lg px-3 py-2.5 text-left text-sm transition " +
                    (cultoSelecionado === c.id
                      ? "bg-accent font-medium text-primary"
                      : "text-foreground hover:bg-surface-elevated")
                  }
                >
                  {c.label}
                </button>
              ))}
            </aside>

            <section className="rounded-2xl border border-border bg-surface-elevated shadow-[var(--shadow-card)]">
              {detalheCulto.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Nenhum check-in nesse culto.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Criança</th>
                      <th className="px-5 py-3 font-medium">Entrada</th>
                      <th className="px-5 py-3 font-medium">Saída</th>
                      <th className="px-5 py-3 font-medium">Emergência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalheCulto.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 font-medium text-foreground">{c.nome}</td>
                        <td className="px-5 py-3 text-muted-foreground">{c.entrada}</td>
                        <td className="px-5 py-3 text-muted-foreground">{c.saida ?? "Ainda na sala"}</td>
                        <td className="px-5 py-3">
                          {c.emergencia ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emergency-border bg-emergency-surface px-2 py-0.5 text-xs font-medium text-foreground">
                              Sim
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Não</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}

        {!carregando && aba === "mes" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
            <aside className="space-y-1.5">
              {meses.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
              )}
              {meses.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMesSelecionado(m)}
                  className={
                    "block w-full rounded-lg px-3 py-2.5 text-left text-sm capitalize transition " +
                    (mesSelecionado === m
                      ? "bg-accent font-medium text-primary"
                      : "text-foreground hover:bg-surface-elevated")
                  }
                >
                  {mesLabel(m)}
                </button>
              ))}
            </aside>

            {statsMes && (
              <div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard valor={statsMes.totalCheckins} label="Check-ins no mês" />
                  <StatCard valor={statsMes.criancasUnicas} label="Crianças únicas" />
                  <StatCard valor={statsMes.totalCultos} label="Cultos no mês" />
                  <StatCard valor={statsMes.totalEmergencias} label="Emergências" />
                </div>

                <div className="mt-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                      Check-ins por culto
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      Média de {statsMes.mediaCriancasPorCulto} por culto
                    </span>
                  </div>

                  {statsMes.barrasCultos.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">Nenhum culto registrado nesse mês.</p>
                  ) : (
                    <div className="mt-6 flex h-40 items-end gap-3 overflow-x-auto">
                      {statsMes.barrasCultos.map((b, i) => {
                        const max = Math.max(...statsMes.barrasCultos.map((x) => x.total));
                        return (
                          <div key={i} className="flex min-w-[64px] flex-1 flex-col items-center gap-2">
                            <div
                              className="w-full rounded-t-md bg-primary"
                              style={{ height: `${(b.total / max) * 100}%` }}
                            />
                            <span className="text-center text-[10px] leading-tight text-muted-foreground">
                              {b.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ valor, label }: { valor: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-card)]">
      <p className="text-2xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
        {valor}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
