import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireEquipeSession } from "../lib/auth-guard";
import { IGREJA_ID, supabase } from "../lib/supabase";

export const Route = createFileRoute("/equipe-aula")({
  beforeLoad: requireEquipeSession,
  component: EquipeAula,
});

type Sala = { id: string; nome: string };

type Relatorio = {
  id: string;
  sala_id: string;
  data: string;
  tema: string | null;
  resumo: string;
  leitura_sugerida: string | null;
  atividade_sugerida: string | null;
  foto_path: string | null;
};

function inicioDaSemana(d = new Date()) {
  const dia = d.getDay();
  const diff = d.getDate() - dia; // volta pro domingo dessa semana
  const inicio = new Date(d.getFullYear(), d.getMonth(), diff);
  return inicio.toISOString().slice(0, 10);
}

function EquipeAula() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [salaId, setSalaId] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const [tema, setTema] = useState("");
  const [resumo, setResumo] = useState("");
  const [leitura, setLeitura] = useState("");
  const [atividade, setAtividade] = useState("");
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
  const [fotoAtualPath, setFotoAtualPath] = useState<string | null>(null);
  const [fotoAtualUrl, setFotoAtualUrl] = useState<string | null>(null);
  const [relatorioIdExistente, setRelatorioIdExistente] = useState<string | null>(null);

  useEffect(() => {
    async function carregarSalas() {
      const { data } = await supabase.from("kids_salas").select("id, nome").order("faixa_etaria_min");
      setSalas(data ?? []);
      if (data && data.length > 0) setSalaId(data[0].id);
      setCarregando(false);
    }
    carregarSalas();
  }, []);

  useEffect(() => {
    if (!salaId) return;
    async function carregarSemanaAtual() {
      setSucesso(false);
      const { data } = await supabase
        .from("kids_relatorios_aula")
        .select("*")
        .eq("sala_id", salaId)
        .eq("data", inicioDaSemana())
        .is("crianca_id", null)
        .maybeSingle();

      const r = data as Relatorio | null;
      setRelatorioIdExistente(r?.id ?? null);
      setTema(r?.tema ?? "");
      setResumo(r?.resumo ?? "");
      setLeitura(r?.leitura_sugerida ?? "");
      setAtividade(r?.atividade_sugerida ?? "");
      setFotoAtualPath(r?.foto_path ?? null);
      setArquivoFoto(null);

      if (r?.foto_path) {
        const { data: signed } = await supabase.storage
          .from("relatorios-fotos")
          .createSignedUrl(r.foto_path, 3600);
        setFotoAtualUrl(signed?.signedUrl ?? null);
      } else {
        setFotoAtualUrl(null);
      }
    }
    carregarSemanaAtual();
  }, [salaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      let fotoPath = fotoAtualPath;

      if (arquivoFoto) {
        const extensao = arquivoFoto.name.split(".").pop() ?? "jpg";
        const caminho = `${salaId}/${crypto.randomUUID()}.${extensao}`;
        const { error: uploadError } = await supabase.storage
          .from("relatorios-fotos")
          .upload(caminho, arquivoFoto, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);
        fotoPath = caminho;
      }

      const payload = {
        igreja_id: IGREJA_ID,
        sala_id: salaId,
        crianca_id: null,
        data: inicioDaSemana(),
        tema: tema || null,
        resumo,
        leitura_sugerida: leitura || null,
        atividade_sugerida: atividade || null,
        foto_path: fotoPath,
      };

      if (relatorioIdExistente) {
        const { error } = await supabase
          .from("kids_relatorios_aula")
          .update(payload)
          .eq("id", relatorioIdExistente);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("kids_relatorios_aula").insert(payload);
        if (error) throw new Error(error.message);
      }

      setSucesso(true);

      // Dispara o push em paralelo — não bloqueia a tela se falhar
      supabase.functions
        .invoke("enviar-push-aula", { body: { sala_id: salaId, tema } })
        .catch(() => {
          // silencioso — publicar o conteúdo já é o essencial
        });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
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
              Aula da semana
            </h1>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Conteúdo que os pais vão ver em casa
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-10 lg:py-10">
        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <label className="block max-w-xs">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Turma</span>
              <select
                value={salaId}
                onChange={(e) => setSalaId(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none focus:border-ring focus:shadow-[var(--shadow-focus)]"
              >
                {salas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </label>

            {erro && (
              <div className="mt-6 rounded-md border border-emergency-border bg-emergency-surface px-4 py-3 text-sm text-foreground">
                {erro}
              </div>
            )}
            {sucesso && (
              <div className="mt-6 rounded-md border border-border bg-accent px-4 py-3 text-sm font-medium text-primary">
                Conteúdo da semana salvo. Já está visível para os pais dessa turma.
              </div>
            )}

            <form className="mt-6 space-y-5 rounded-2xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-card)]" onSubmit={handleSubmit}>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Semana de {new Date(inicioDaSemana() + "T00:00:00").toLocaleDateString("pt-BR")}
              </p>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Tema da semana</span>
                <input
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ex: Davi e Golias — coragem"
                  className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none focus:border-ring focus:shadow-[var(--shadow-focus)]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">O que foi trabalhado na aula</span>
                <textarea
                  required
                  rows={3}
                  value={resumo}
                  onChange={(e) => setResumo(e.target.value)}
                  placeholder="Ex: Conversamos sobre ter coragem mesmo com medo. As crianças fizeram um desenho da atividade."
                  className="w-full resize-none rounded-md border border-input bg-surface-elevated px-3 py-2.5 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none focus:border-ring focus:shadow-[var(--shadow-focus)]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Leitura sugerida em casa <span className="font-normal text-muted-foreground">(opcional)</span>
                </span>
                <input
                  value={leitura}
                  onChange={(e) => setLeitura(e.target.value)}
                  placeholder="Ex: 1 Samuel 17"
                  className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none focus:border-ring focus:shadow-[var(--shadow-focus)]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Atividade sugerida em casa <span className="font-normal text-muted-foreground">(opcional)</span>
                </span>
                <input
                  value={atividade}
                  onChange={(e) => setAtividade(e.target.value)}
                  placeholder="Ex: Desenhe algo que te dá coragem"
                  className="h-11 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none focus:border-ring focus:shadow-[var(--shadow-focus)]"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Foto da turma <span className="font-normal text-muted-foreground">(opcional)</span>
                </span>
                {fotoAtualUrl && !arquivoFoto && (
                  <img src={fotoAtualUrl} alt="Foto atual da turma" className="mb-3 h-40 w-full rounded-lg object-cover" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArquivoFoto(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Só é visível para os pais das crianças dessa turma. Nunca aparece fora do app.
                </p>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/92 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar e publicar"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
