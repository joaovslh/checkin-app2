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
  salaId: string | null;
  salaNome: string | null;
};

type StatusCheckin = {
  id: string;
  entradaEm: string;
  saidaEm: string | null;
} | null;

type Chamada = {
  id: string;
  abertaEm: string;
} | null;

type AulaSemana = {
  id: string;
  data: string;
  tema: string | null;
  resumo: string;
  leituraSugerida: string | null;
  atividadeSugerida: string | null;
  fotoUrl: string | null;
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

// Converte a chave pública VAPID (base64 url-safe) pro formato que a
// Push API do navegador espera (Uint8Array)
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function Familia() {
  const navigate = useNavigate();
  const [filhos, setFilhos] = useState<Filho[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusCheckin>(null);
  const [chamada, setChamada] = useState<Chamada>(null);
  const [aulas, setAulas] = useState<AulaSemana[]>([]);
  const [statusNotificacao, setStatusNotificacao] = useState<
    "verificando" | "ativa" | "inativa" | "indisponivel" | "negada"
  >("verificando");
  const [ativandoNotificacao, setAtivandoNotificacao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mostrarRetirada, setMostrarRetirada] = useState(false);
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [confirmandoRetirada, setConfirmandoRetirada] = useState(false);
  const [erroRetirada, setErroRetirada] = useState<string | null>(null);

  // Carrega os filhos do responsável logado (RLS já filtra sozinho)
  useEffect(() => {
    async function carregarFilhos() {
      const { data } = await supabase
        .from("kids_criancas")
        .select("id, nome, sala_id, kids_salas(nome)")
        .order("nome", { ascending: true });

      const lista: Filho[] = (data ?? []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        salaId: c.sala_id,
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
          .select("id, entrada_em, saida_em")
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

      setStatus(checkinData ? { id: checkinData.id, entradaEm: checkinData.entrada_em, saidaEm: checkinData.saida_em } : null);
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

  // Busca o conteúdo da turma (últimas 2 semanas) + assina Realtime
  const filhoSelecionadoParaSala = filhos.find((f) => f.id === selecionadoId);
  const salaIdAtual = filhoSelecionadoParaSala?.salaId ?? null;

  useEffect(() => {
    if (!salaIdAtual) {
      setAulas([]);
      return;
    }

    async function carregarAulas() {
      const duasSemanasAtras = new Date();
      duasSemanasAtras.setDate(duasSemanasAtras.getDate() - 14);
      const limite = duasSemanasAtras.toISOString().slice(0, 10);

      const { data } = await supabase
        .from("kids_relatorios_aula")
        .select("id, data, tema, resumo, leitura_sugerida, atividade_sugerida, foto_path")
        .eq("sala_id", salaIdAtual)
        .is("crianca_id", null)
        .gte("data", limite)
        .order("data", { ascending: false });

      const lista: AulaSemana[] = [];
      for (const r of data ?? []) {
        let fotoUrl: string | null = null;
        if (r.foto_path) {
          const { data: signed } = await supabase.storage
            .from("relatorios-fotos")
            .createSignedUrl(r.foto_path, 3600);
          fotoUrl = signed?.signedUrl ?? null;
        }
        lista.push({
          id: r.id,
          data: r.data,
          tema: r.tema,
          resumo: r.resumo,
          leituraSugerida: r.leitura_sugerida,
          atividadeSugerida: r.atividade_sugerida,
          fotoUrl,
        });
      }
      setAulas(lista);
    }

    carregarAulas();

    const canal = supabase
      .channel(`aula-${salaIdAtual}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kids_relatorios_aula", filter: `sala_id=eq.${salaIdAtual}` },
        () => carregarAulas(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [salaIdAtual]);

  async function confirmarRetirada() {
    if (!status) return;
    setErroRetirada(null);
    setConfirmandoRetirada(true);

    const { data, error } = await supabase.rpc("responsavel_confirmar_retirada", {
      p_checkin_id: status.id,
      p_codigo: codigoDigitado.trim(),
    });

    setConfirmandoRetirada(false);

    if (error || !data?.sucesso) {
      setErroRetirada(data?.erro ?? "Não foi possível confirmar. Tente novamente.");
      return;
    }

    setMostrarRetirada(false);
    setCodigoDigitado("");
    // O Realtime já vai atualizar sozinho, mas atualiza na hora também
    setStatus(null);
  }

  useEffect(() => {
    setMostrarRetirada(false);
    setCodigoDigitado("");
    setErroRetirada(null);
  }, [selecionadoId]);

  // Confere se já existe inscrição de push ativa nesse navegador
  useEffect(() => {
    async function verificar() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatusNotificacao("indisponivel");
        return;
      }
      if (Notification.permission === "denied") {
        setStatusNotificacao("negada");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const inscricaoAtual = await registration.pushManager.getSubscription();
      setStatusNotificacao(inscricaoAtual ? "ativa" : "inativa");
    }
    verificar();
  }, []);

  async function ativarNotificacoes() {
    setAtivandoNotificacao(true);

    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setStatusNotificacao("negada");
        setAtivandoNotificacao(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

      const inscricao = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const responsavelId = sessionData.session?.user.app_metadata?.responsavel_id as string | undefined;

      if (!responsavelId) throw new Error("Sessão inválida.");

      const json = inscricao.toJSON();
      await supabase.from("kids_push_subscriptions").insert({
        responsavel_id: responsavelId,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      });

      setStatusNotificacao("ativa");
    } catch (err) {
      console.error("Erro ao ativar notificações:", err);
    } finally {
      setAtivandoNotificacao(false);
    }
  }

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
            <img src="/logo-mascote.png" alt="" aria-hidden className="h-9 w-9 object-contain" />
            <span className="text-lg font-semibold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Virtude Kids
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
        {statusNotificacao === "inativa" && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-primary">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </div>
              <p className="text-sm text-foreground">
                Ative notificações para saber quando a aula da semana for publicada.
              </p>
            </div>
            <button
              type="button"
              onClick={ativarNotificacoes}
              disabled={ativandoNotificacao}
              className="inline-flex h-9 shrink-0 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 disabled:opacity-50"
            >
              {ativandoNotificacao ? "Ativando..." : "Ativar"}
            </button>
          </div>
        )}

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

                <div className="mt-5 rounded-2xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-4">
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

                  {status && !mostrarRetirada && (
                    <button
                      type="button"
                      onClick={() => setMostrarRetirada(true)}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:bg-secondary"
                    >
                      Retirar agora
                    </button>
                  )}

                  {status && mostrarRetirada && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">
                        Digite o código de 4 dígitos que está no adesivo para confirmar a retirada.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={codigoDigitado}
                          onChange={(e) => setCodigoDigitado(e.target.value.replace(/\D/g, ""))}
                          placeholder="0000"
                          className="h-11 w-24 rounded-md border border-input bg-surface-elevated px-3 text-center text-lg tracking-[0.3em] text-foreground shadow-[var(--shadow-soft)] outline-none focus:border-ring focus:shadow-[var(--shadow-focus)]"
                        />
                        <button
                          type="button"
                          disabled={codigoDigitado.length !== 4 || confirmandoRetirada}
                          onClick={confirmarRetirada}
                          className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/92 disabled:opacity-50"
                        >
                          {confirmandoRetirada ? "Confirmando..." : "Confirmar"}
                        </button>
                      </div>
                      {erroRetirada && (
                        <p className="mt-2 text-sm text-emergency">{erroRetirada}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarRetirada(false);
                          setCodigoDigitado("");
                          setErroRetirada(null);
                        }}
                        className="mt-2 text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Essa tela atualiza sozinha assim que a equipe fizer o check-in, check-out, ou chamar você.
                </p>

                {aulas.length > 0 && (
                  <div className="mt-10">
                    <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Na sala
                    </p>
                    <h2
                      className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      O que estão aprendendo
                    </h2>

                    <div className="mt-5 space-y-4">
                      {aulas.map((a, i) => (
                        <article
                          key={a.id}
                          className="overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-[var(--shadow-card)]"
                        >
                          {a.fotoUrl && (
                            <img src={a.fotoUrl} alt="Foto da turma" className="h-48 w-full object-cover" />
                          )}
                          <div className="p-5">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                                Semana de {new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")}
                              </p>
                              {i === 0 && (
                                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-primary">
                                  Atual
                                </span>
                              )}
                            </div>
                            {a.tema && (
                              <h3 className="mt-1.5 text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                                {a.tema}
                              </h3>
                            )}
                            <p className="mt-2 text-sm leading-relaxed text-foreground/85">{a.resumo}</p>

                            {(a.leituraSugerida || a.atividadeSugerida) && (
                              <div className="mt-4 space-y-2 border-t border-border pt-4">
                                {a.leituraSugerida && (
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Leitura em casa: </span>
                                    {a.leituraSugerida}
                                  </p>
                                )}
                                {a.atividadeSugerida && (
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Atividade em casa: </span>
                                    {a.atividadeSugerida}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
