import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireResponsavelSession } from "../lib/auth-guard";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/familia")({
  beforeLoad: requireResponsavelSession,
  component: Familia,
});

type Filho = {
  id: string;
  nome: string;
  salaNome: string | null;
};

type StatusCheckin = {
  entradaEm: string;
  saidaEm: string | null;
} | null;

type Chamada = {
  id: string;
  abertaEm: string;
} | null;

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

function Familia() {
  const navigate = useNavigate();
  const [filhos, setFilhos] = useState<Filho[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusCheckin>(null);
  const [chamada, setChamada] = useState<Chamada>(null);
  const [carregando, setCarregando] = useState(true);

  // Carrega os filhos do responsável logado (RLS já filtra sozinho)
  useEffect(() => {
    async function carregarFilhos() {
      const { data } = await supabase
        .from("kids_criancas")
        .select("id, nome, kids_salas(nome)")
        .order("nome", { ascending: true });

      const lista: Filho[] = (data ?? []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        salaNome: c.kids_salas?.nome ?? null,
      }));

      setFilhos(lista);
      if (lista.length > 0) setSelecionadoId(lista[0].id);
      setCarregando(false);
    }
    carregarFilhos();
  }, []);

  // Busca o status atual + assina Realtime pro filho selecionado
  useEffect(() => {
    if (!selecionadoId) return;

    async function carregarStatus() {
      const [{ data: checkinData }, { data: chamadaData }] = await Promise.all([
        supabase
          .from("kids_checkins")
          .select("entrada_em, saida_em")
          .eq("crianca_id", selecionadoId)
          .is("saida_em", null)
          .maybeSingle(),
        supabase
          .from("kids_chamadas")
          .select("id, aberta_em")
          .eq("crianca_id", selecionadoId)
          .eq("status", "aberta")
          .maybeSingle(),
      ]);

      setStatus(checkinData ? { entradaEm: checkinData.entrada_em, saidaEm: checkinData.saida_em } : null);
      setChamada(chamadaData ? { id: chamadaData.id, abertaEm: chamadaData.aberta_em } : null);
    }

    carregarStatus();

    const canal = supabase
      .channel(`familia-${selecionadoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kids_checkins", filter: `crianca_id=eq.${selecionadoId}` },
        () => carregarStatus(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kids_chamadas", filter: `crianca_id=eq.${selecionadoId}` },
        () => carregarStatus(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [selecionadoId]);

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const filhoSelecionado = filhos.find((f) => f.id === selecionadoId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-6">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Sela
            </span>
            <span className="text-sm text-muted-foreground">família</span>
          </div>
          <button
            type="button"
            onClick={sair}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : filhos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma criança encontrada vinculada a este número.
          </p>
        ) : (
          <>
            {filhos.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {filhos.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelecionadoId(f.id)}
                    className={
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition " +
                      (selecionadoId === f.id
                        ? "border-primary/40 bg-accent text-primary"
                        : "border-border bg-surface-elevated text-foreground hover:border-foreground/20")
                    }
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {initials(f.nome)}
                    </span>
                    {f.nome.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}

            {filhoSelecionado && (
              <section className="mt-6">
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Agora
                </p>
                <h1
                  className="mt-1 text-3xl font-semibold tracking-tight text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Como está {filhoSelecionado.nome.split(" ")[0]}
                </h1>

                {chamada && (
                  <div className="mt-5 rounded-2xl border border-emergency-border bg-emergency-surface p-5 shadow-[var(--shadow-card)]">
                    <p className="text-sm font-semibold text-foreground">
                      A equipe está chamando você
                    </p>
                    <p className="mt-1 text-sm text-foreground/80">
                      Acionado às {horaFormatada(chamada.abertaEm)}. Dirija-se até a sala {filhoSelecionado.salaNome ?? ""} o quanto antes.
                    </p>
                  </div>
                )}

                <div className="mt-5 flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-card)]">
                  <div
                    aria-hidden
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-lg font-semibold text-primary"
                  >
                    {initials(filhoSelecionado.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    {status ? (
                      <>
                        <p className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          Na sala {filhoSelecionado.salaNome ?? ""}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Entrada às {horaFormatada(status.entradaEm)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base font-semibold text-foreground">Sem check-in ativo</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Nenhum registro de entrada agora.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Essa tela atualiza sozinha assim que a equipe fizer o check-in, check-out, ou chamar você.
                </p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
