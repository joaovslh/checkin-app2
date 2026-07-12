import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireEquipeSession } from "../lib/auth-guard";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/equipe-aniversariantes")({
  beforeLoad: requireEquipeSession,
  component: EquipeAniversariantes,
});

type Aniversariante = {
  id: string;
  nome: string;
  dia: number;
  idadeVaiCompletar: number;
  salaNome: string;
  responsavelNome: string;
};

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function EquipeAniversariantes() {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const hoje = new Date();
  const mesAtual = hoje.getMonth(); // 0-11

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const { data, error } = await supabase
        .from("kids_criancas")
        .select("id, nome, data_nascimento, kids_salas(nome), kids_responsaveis(nome)");

      if (error) {
        setErro("Não foi possível carregar os aniversariantes.");
        setCarregando(false);
        return;
      }

      const doMes: Aniversariante[] = (data ?? [])
        .map((c: any) => {
          const nasc = new Date(c.data_nascimento + "T00:00:00");
          return {
            id: c.id,
            nome: c.nome,
            dia: nasc.getDate(),
            mes: nasc.getMonth(),
            idadeVaiCompletar: hoje.getFullYear() - nasc.getFullYear(),
            salaNome: c.kids_salas?.nome ?? "Sem sala",
            responsavelNome: c.kids_responsaveis?.nome ?? "—",
          };
        })
        .filter((c: any) => c.mes === mesAtual)
        .sort((a: any, b: any) => a.dia - b.dia);

      setAniversariantes(doMes);
      setCarregando(false);
    }
    carregar();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-6 lg:px-10">
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
              Aniversariantes
            </h1>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {NOMES_MES[mesAtual]}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-6 py-8 lg:px-10 lg:py-10">
        {erro && (
          <div className="mb-6 rounded-md border border-emergency-border bg-emergency-surface px-4 py-3 text-sm text-foreground">
            {erro}
          </div>
        )}

        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : aniversariantes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
            <p className="text-sm font-medium text-foreground">Nenhum aniversário este mês</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Volta aqui no próximo mês para ver quem está de aniversário.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {aniversariantes.map((a) => {
              const jaPassou = a.dia < hoje.getDate();
              return (
                <li
                  key={a.id}
                  className={
                    "flex items-center gap-4 rounded-2xl border p-4 shadow-[var(--shadow-card)] " +
                    (jaPassou
                      ? "border-border bg-surface opacity-60"
                      : "border-primary/20 bg-surface-elevated")
                  }
                >
                  <div
                    aria-hidden
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent text-sm font-bold text-primary"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {String(a.dia).padStart(2, "0")}
                  </div>
                  <div
                    aria-hidden
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold text-muted-foreground ring-1 ring-inset ring-border"
                  >
                    {initials(a.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {a.nome} {!jaPassou && "🎂"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Completa {a.idadeVaiCompletar} anos · {a.salaNome} · resp: {a.responsavelNome}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
