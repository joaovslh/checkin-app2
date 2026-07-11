import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireEquipeSession } from "../lib/auth-guard";
import { IGREJA_ID, supabase } from "../lib/supabase";

export const Route = createFileRoute("/equipe-cadastro")({
  beforeLoad: requireEquipeSession,
  component: EquipeCadastro,
});

type Sala = {
  id: string;
  nome: string;
  faixa_etaria_min: number | null;
  faixa_etaria_max: number | null;
};

type Crianca = {
  id: string;
  nome: string;
  data_nascimento: string;
  alergias: string[] | null;
  observacoes: string | null;
  sala_id: string | null;
  responsavel_principal_id: string;
  kids_salas: { nome: string } | null;
  kids_responsaveis: { id: string; nome: string; telefone: string } | null;
};

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function idadeEmAnos(dataNascimento: string): string {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) anos -= 1;
  return `${anos} ano${anos === 1 ? "" : "s"}`;
}

function idadeEmMeses(dataNascimento: string): number {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let meses = (hoje.getFullYear() - nascimento.getFullYear()) * 12;
  meses += hoje.getMonth() - nascimento.getMonth();
  if (hoje.getDate() < nascimento.getDate()) meses -= 1;
  return meses;
}

function sugerirSala(dataNascimento: string, salas: Sala[]): string | null {
  if (!dataNascimento) return null;
  const meses = idadeEmMeses(dataNascimento);
  const sala = salas.find(
    (s) => s.faixa_etaria_min !== null && s.faixa_etaria_max !== null && meses >= s.faixa_etaria_min && meses <= s.faixa_etaria_max,
  );
  return sala?.id ?? null;
}

function EquipeCadastro() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregandoAutorizacoes, setCarregandoAutorizacoes] = useState(false);
  const [autorizados, setAutorizados] = useState([{ nome: "", parentesco: "" }]);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // campos do formulário
  const [nomeCrianca, setNomeCrianca] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [salaId, setSalaId] = useState("");
  const [salaSugeridaAutomaticamente, setSalaSugeridaAutomaticamente] = useState(false);
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");
  const [alergias, setAlergias] = useState("");
  const [observacoes, setObservacoes] = useState("");

  async function carregarDados() {
    setCarregando(true);

    const [{ data: salasData }, { data: criancasData, error: criancasError }] = await Promise.all([
      supabase.from("kids_salas").select("id, nome, faixa_etaria_min, faixa_etaria_max").order("faixa_etaria_min", { ascending: true }),
      supabase
        .from("kids_criancas")
        .select("id, nome, data_nascimento, alergias, observacoes, sala_id, responsavel_principal_id, kids_salas(nome), kids_responsaveis(id, nome, telefone)")
        .order("nome", { ascending: true }),
    ]);

    if (salasData) {
      setSalas(salasData);
      if (salasData.length > 0) setSalaId((prev) => prev || salasData[0].id);
    }
    if (criancasError) {
      setErro("Não foi possível carregar as crianças cadastradas.");
    } else if (criancasData) {
      setCriancas(criancasData as unknown as Crianca[]);
    }

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function handleDataNascimentoChange(valor: string) {
    setDataNascimento(valor);
    const sugerida = sugerirSala(valor, salas);
    if (sugerida) {
      setSalaId(sugerida);
      setSalaSugeridaAutomaticamente(true);
    } else {
      setSalaSugeridaAutomaticamente(false);
    }
  }

  function adicionarAutorizado() {
    if (autorizados.length >= 3) return;
    setAutorizados((prev) => [...prev, { nome: "", parentesco: "" }]);
  }

  function atualizarAutorizado(index: number, campo: "nome" | "parentesco", valor: string) {
    setAutorizados((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [campo]: valor } : a)),
    );
  }

  function limparFormulario() {
    setNomeCrianca("");
    setDataNascimento("");
    setSalaSugeridaAutomaticamente(false);
    setNomeResponsavel("");
    setTelefoneResponsavel("");
    setAlergias("");
    setObservacoes("");
    setAutorizados([{ nome: "", parentesco: "" }]);
    setEditandoId(null);
    setConfirmandoExclusao(false);
  }

  function abrirNovo() {
    limparFormulario();
    setMostrarForm(true);
  }

  async function abrirEdicao(c: Crianca) {
    setEditandoId(c.id);
    setNomeCrianca(c.nome);
    setDataNascimento(c.data_nascimento);
    setSalaId(c.sala_id ?? "");
    setSalaSugeridaAutomaticamente(false);
    setNomeResponsavel(c.kids_responsaveis?.nome ?? "");
    // remove o +55 pra exibir só o número no campo
    setTelefoneResponsavel((c.kids_responsaveis?.telefone ?? "").replace(/^\+55/, ""));
    setAlergias((c.alergias ?? []).join(", "));
    setObservacoes(c.observacoes ?? "");
    setMostrarForm(true);

    setCarregandoAutorizacoes(true);
    const { data } = await supabase
      .from("kids_autorizacoes_retirada")
      .select("nome, parentesco")
      .eq("crianca_id", c.id);
    setAutorizados(
      data && data.length > 0
        ? data.map((a) => ({ nome: a.nome, parentesco: a.parentesco ?? "" }))
        : [{ nome: "", parentesco: "" }],
    );
    setCarregandoAutorizacoes(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      const telefoneLimpo = `+55${telefoneResponsavel.replace(/\D/g, "")}`;
      const alergiasArray = alergias
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      if (editandoId) {
        // ---------- MODO EDIÇÃO ----------
        const criancaAtual = criancas.find((c) => c.id === editandoId);
        if (!criancaAtual) throw new Error("Criança não encontrada.");

        const { error: criancaError } = await supabase
          .from("kids_criancas")
          .update({
            nome: nomeCrianca,
            data_nascimento: dataNascimento,
            sala_id: salaId || null,
            alergias: alergiasArray,
            observacoes: observacoes || null,
          })
          .eq("id", editandoId);

        if (criancaError) throw new Error(criancaError.message);

        if (criancaAtual.kids_responsaveis?.id) {
          const { error: respError } = await supabase
            .from("kids_responsaveis")
            .update({
              nome: nomeResponsavel,
              telefone: telefoneLimpo,
            })
            .eq("id", criancaAtual.kids_responsaveis.id);

          if (respError) throw new Error(respError.message);
        }

        // Substitui as autorizações extras por completo (mais simples e seguro
        // do que tentar diferenciar quais mudaram)
        await supabase.from("kids_autorizacoes_retirada").delete().eq("crianca_id", editandoId);
        const autorizacoesPreenchidas = autorizados.filter((a) => a.nome.trim());
        if (autorizacoesPreenchidas.length > 0) {
          const { error: autError } = await supabase.from("kids_autorizacoes_retirada").insert(
            autorizacoesPreenchidas.map((a) => ({
              igreja_id: IGREJA_ID,
              crianca_id: editandoId,
              nome: a.nome,
              parentesco: a.parentesco || null,
            })),
          );
          if (autError) throw new Error(autError.message);
        }
      } else {
        // ---------- MODO NOVO CADASTRO ----------
        // 1. Reaproveita o responsável se já existir (mesmo telefone), senão cria
        const { data: responsavelExistente } = await supabase
          .from("kids_responsaveis")
          .select("id")
          .eq("igreja_id", IGREJA_ID)
          .eq("telefone", telefoneLimpo)
          .maybeSingle();

        let responsavelId: string;

        if (responsavelExistente) {
          responsavelId = responsavelExistente.id;
        } else {
          const { data: novoResponsavel, error: respError } = await supabase
            .from("kids_responsaveis")
            .insert({
              igreja_id: IGREJA_ID,
              nome: nomeResponsavel,
              telefone: telefoneLimpo,
            })
            .select("id")
            .single();

          if (respError || !novoResponsavel) throw new Error(respError?.message ?? "Erro ao criar responsável");
          responsavelId = novoResponsavel.id;
        }

        // 2. Cria a criança
        const { data: novaCrianca, error: criancaError } = await supabase
          .from("kids_criancas")
          .insert({
            igreja_id: IGREJA_ID,
            responsavel_principal_id: responsavelId,
            sala_id: salaId || null,
            nome: nomeCrianca,
            data_nascimento: dataNascimento,
            alergias: alergiasArray,
            observacoes: observacoes || null,
          })
          .select("id")
          .single();

        if (criancaError || !novaCrianca) throw new Error(criancaError?.message ?? "Erro ao cadastrar criança");

        // 3. Autorizações extras (só as preenchidas)
        const autorizacoesPreenchidas = autorizados.filter((a) => a.nome.trim());
        if (autorizacoesPreenchidas.length > 0) {
          const { error: autError } = await supabase.from("kids_autorizacoes_retirada").insert(
            autorizacoesPreenchidas.map((a) => ({
              igreja_id: IGREJA_ID,
              crianca_id: novaCrianca.id,
              nome: a.nome,
              parentesco: a.parentesco || null,
            })),
          );
          if (autError) throw new Error(autError.message);
        }

        // 4. Consentimento de termos gerais
        await supabase.from("kids_consentimentos").insert({
          igreja_id: IGREJA_ID,
          crianca_id: novaCrianca.id,
          responsavel_id: responsavelId,
          tipo: "termos_gerais",
          aceito: true,
          aceito_em: new Date().toISOString(),
          versao_termo: "v1",
        });
      }

      limparFormulario();
      setMostrarForm(false);
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar cadastro.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirCadastro() {
    if (!editandoId) return;
    setErro(null);
    setExcluindo(true);

    // A exclusão da criança já remove em cascata (definido no schema):
    // autorizações de retirada, consentimentos, check-ins, chamadas de
    // emergência e o vetor facial (se existir). O responsável NÃO é
    // apagado, pois pode ter outros filhos vinculados.
    const { error } = await supabase.from("kids_criancas").delete().eq("id", editandoId);

    if (error) {
      setErro("Não foi possível excluir o cadastro. Tente novamente.");
      setExcluindo(false);
      return;
    }

    limparFormulario();
    setMostrarForm(false);
    setExcluindo(false);
    await carregarDados();
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
            onClick={() => (mostrarForm && !editandoId ? setMostrarForm(false) : abrirNovo())}
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
        {erro && (
          <div className="mb-6 rounded-md border border-emergency-border bg-emergency-surface px-4 py-3 text-sm text-foreground">
            {erro}
          </div>
        )}

        {mostrarForm && (
          <section className="mb-10 rounded-2xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {editandoId ? "Editar cadastro" : "Novo cadastro"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {editandoId
                ? "Atualize os dados da criança e do responsável."
                : "Cadastro feito pela equipe, presencial. O reconhecimento facial é habilitado depois, em uma fase futura."}
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nome da criança">
                  <TextInput
                    required
                    value={nomeCrianca}
                    onChange={(e) => setNomeCrianca(e.target.value)}
                    placeholder="Ex: Laura Mendonça"
                  />
                </Field>
                <Field label="Data de nascimento">
                  <TextInput
                    required
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => handleDataNascimentoChange(e.target.value)}
                  />
                </Field>
                <Field
                  label="Sala"
                  aside={
                    salaSugeridaAutomaticamente ? (
                      <span className="text-xs font-medium text-primary">Sugerida pela idade</span>
                    ) : undefined
                  }
                >
                  <select
                    value={salaId}
                    onChange={(e) => {
                      setSalaId(e.target.value);
                      setSalaSugeridaAutomaticamente(false);
                    }}
                    className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none focus:border-ring focus:shadow-[var(--shadow-focus)]"
                  >
                    <option value="">Selecione</option>
                    {salas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Nome do responsável">
                  <TextInput
                    required
                    value={nomeResponsavel}
                    onChange={(e) => setNomeResponsavel(e.target.value)}
                    placeholder="Ex: Ana Mendonça"
                  />
                </Field>
                <Field label="WhatsApp do responsável">
                  <div className="flex h-11 items-stretch overflow-hidden rounded-md border border-input bg-surface-elevated shadow-[var(--shadow-soft)] focus-within:border-ring focus-within:shadow-[var(--shadow-focus)]">
                    <div className="flex items-center gap-2 border-r border-border bg-surface px-3 text-[15px] font-medium text-foreground">
                      <span aria-hidden>🇧🇷</span>
                      +55
                    </div>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      value={telefoneResponsavel}
                      onChange={(e) => setTelefoneResponsavel(e.target.value)}
                      placeholder="(11) 91234-5678"
                      className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
                    />
                  </div>
                </Field>
                <Field label="Alergias" aside={<span className="text-xs font-medium text-muted-foreground">Opcional</span>}>
                  <TextInput
                    value={alergias}
                    onChange={(e) => setAlergias(e.target.value)}
                    placeholder="Ex: amendoim, lactose"
                  />
                </Field>
              </div>

              <Field label="Observações" aside={<span className="text-xs font-medium text-muted-foreground">Opcional</span>}>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
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
                  {autorizados.map((a, i) => (
                    <div key={i} className="grid gap-2.5 sm:grid-cols-2">
                      <TextInput
                        value={a.nome}
                        onChange={(e) => atualizarAutorizado(i, "nome", e.target.value)}
                        placeholder="Nome"
                      />
                      <TextInput
                        value={a.parentesco}
                        onChange={(e) => atualizarAutorizado(i, "parentesco", e.target.value)}
                        placeholder="Parentesco (ex: avó, tio)"
                      />
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

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={salvando || carregandoAutorizacoes}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/92 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Salvar cadastro"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    limparFormulario();
                    setMostrarForm(false);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-5 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                >
                  Cancelar
                </button>

                {editandoId && !confirmandoExclusao && (
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(true)}
                    className="ml-auto text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-border hover:text-emergency hover:decoration-emergency"
                  >
                    Excluir cadastro
                  </button>
                )}
              </div>

              {editandoId && confirmandoExclusao && (
                <div className="rounded-lg border border-emergency-border bg-emergency-surface p-4">
                  <p className="text-sm font-medium text-foreground">
                    Excluir {nomeCrianca}? Isso apaga também o histórico de check-ins e chamadas de emergência dela. Essa ação não pode ser desfeita.
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      disabled={excluindo}
                      onClick={excluirCadastro}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-emergency px-4 text-sm font-semibold text-emergency-foreground shadow-[var(--shadow-soft)] transition hover:opacity-92 disabled:opacity-50"
                    >
                      {excluindo ? "Excluindo..." : "Sim, excluir definitivamente"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoExclusao(false)}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:bg-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </form>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Crianças cadastradas
          </h2>

          {carregando ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : criancas.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma criança cadastrada ainda. Clique em "Novo cadastro" para começar.
            </p>
          ) : (
            <div className="mt-4 space-y-8">
              {salas
                .map((s) => ({ sala: s, itens: criancas.filter((c) => c.sala_id === s.id) }))
                .concat([{ sala: { id: "sem-sala", nome: "Sem sala", faixa_etaria_min: null, faixa_etaria_max: null }, itens: criancas.filter((c) => !c.sala_id) }])
                .filter((g) => g.itens.length > 0)
                .map((grupo) => (
                  <div key={grupo.sala.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{grupo.sala.nome}</h3>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {grupo.itens.length}
                      </span>
                    </div>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {grupo.itens.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => abrirEdicao(c)}
                            className="w-full rounded-2xl border border-border bg-surface-elevated p-4 text-left shadow-[var(--shadow-card)] transition hover:border-foreground/20 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
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
                                  {idadeEmAnos(c.data_nascimento)} · resp: {c.kids_responsaveis?.nome ?? "—"}
                                </p>
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">Editar</span>
                            </div>
                            {c.alergias && c.alergias.length > 0 && (
                              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emergency-border bg-emergency-surface px-2 py-0.5 text-[11px] font-medium text-foreground">
                                Alergia: {c.alergias.join(", ")}
                              </span>
                            )}
                            <div className="mt-3">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
                                Reconhecimento facial — fase futura
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>
    </div>
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
