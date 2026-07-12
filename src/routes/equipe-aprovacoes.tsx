import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireEquipeSession } from "../lib/auth-guard";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/equipe-aprovacoes")({
  beforeLoad: requireEquipeSession,
  component: EquipeAprovacoes,
});

type Pendente = {
  id: string;
  nome: string;
  dataNascimento: string;
  alergias: string[] | null;
  observacoes: string | null;
  neurodivergencia: boolean;
  necessidadeEspecial: boolean;
  salaNome: string | null;
  responsavelNome: string;
  responsavelTelefone: string;
};

function idadeEmAnos(dataNascimento: string) {
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} ano${idade === 1 ? "" : "s"}`;
}

function EquipeAprovacoes() {
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aprovando, setAprovando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from("kids_criancas")
      .select(
        "id, nome, data_nascimento, alergias, observacoes, neurodivergencia, necessidade_especial, kids_salas(nome), kids_responsaveis(nome, telefone)",
      )
      .eq("status_aprovacao", "pendente")
      .order("criado_em", { ascending: true });

    if (error) {
      setErro("Não foi possível carregar os cadastros pendentes.");
      setCarregando(false);
      return;
    }

    setPendentes(
      (data ?? []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        dataNascimento: c.data_nascimento,
        alergias: c.alergias,
        observacoes: c.observacoes,
        neurodivergencia: c.neurodivergencia,
        necessidadeEspecial: c.necessidade_especial,
        salaNome: c.kids_salas?.nome ?? null,
        responsavelNome: c.kids_responsaveis?.nome ?? "—",
        responsavelTelefone: c.kids_responsaveis?.telefone ?? "",
      })),
    );
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function aprovar(id: string) {
    setAprovando(id);
    setErro(null);
    const { error } = await supabase
      .from("kids_criancas")
      .update({ status_aprovacao: "aprovado" })
      .eq("id", id);

    if (error) {
      setErro("Não foi possível aprovar. Tente novamente.");
    } else {
      setPendentes((prev) => prev.filter((p) => p.id !== id));
    }
    setAprovando(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-6 lg:px-10">
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
            <h1 className="text-lg font-semibold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Aprovações de cadastro
            </h1>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Cadastros novos aguardando revisão
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-10 lg:py-10">
        {erro && (
          <div className="mb-6 rounded-md border border-emergency-border bg-emergency-surface px-4 py-3 text-sm text-foreground">
            {erro}
          </div>
        )}

        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : pendentes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
            <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
            <p className="mt-1 text-sm text-muted-foreground">Nenhum cadastro pendente de aprovação.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {pendentes.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{p.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {idadeEmAnos(p.dataNascimento)} · {p.salaNome ?? "Sem sala"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={aprovando === p.id}
                    onClick={() => aprovar(p.id)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 disabled:opacity-50"
                  >
                    {aprovando === p.id ? "Aprovando..." : "Aprovar"}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {p.neurodivergencia && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent px-2.5 py-1 text-xs font-medium text-primary">
                      Neurodivergência sinalizada
                    </span>
                  )}
                  {p.necessidadeEspecial && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent px-2.5 py-1 text-xs font-medium text-primary">
                      Necessidade especial sinalizada
                    </span>
                  )}
                  {p.alergias && p.alergias.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emergency-border bg-emergency-surface px-2.5 py-1 text-xs font-medium text-foreground">
                      Alergia/restrição: {p.alergias.join(", ")}
                    </span>
                  )}
                </div>

                {(p.neurodivergencia || p.necessidadeEspecial) && (
                  <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-muted-foreground">
                    Recomendado conversar com o responsável antes de aprovar, para entender como
                    melhor acolher a criança na sala.
                  </p>
                )}

                {p.observacoes && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Observações: </span>
                    {p.observacoes}
                  </p>
                )}

                <p className="mt-3 border-t border-border pt-3 text-sm text-foreground">
                  <span className="font-medium">Responsável:</span> {p.responsavelNome}
                  {p.responsavelTelefone && (
                    <span className="text-muted-foreground"> · {p.responsavelTelefone}</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
