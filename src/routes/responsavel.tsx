import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { IGREJA_ID, supabase } from "../lib/supabase";

export const Route = createFileRoute("/responsavel")({
  component: Responsavel,
});

function Responsavel() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<"telefone" | "codigo">("telefone");
  const [phone, setPhone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function formatBR(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    const p1 = digits.slice(0, 2);
    const p2 = digits.slice(2, 7);
    const p3 = digits.slice(7, 11);
    let out = "";
    if (p1) out += `(${p1}`;
    if (p1.length === 2) out += ") ";
    if (p2) out += p2;
    if (p3) out += `-${p3}`;
    return out;
  }

  const masked = formatBR(phone);
  const telefoneValido = phone.replace(/\D/g, "").length >= 10;

  async function handleEnviarCodigo() {
    setErro(null);
    setEnviando(true);

    const telefoneLimpo = `+55${phone.replace(/\D/g, "")}`;

    const { data, error } = await supabase.functions.invoke("responsavel-solicitar-codigo", {
      body: { igreja_id: IGREJA_ID, telefone: telefoneLimpo },
    });

    setEnviando(false);

    if (error || data?.error) {
      setErro(data?.error ?? "Não foi possível enviar o código. Tente novamente.");
      return;
    }

    setNome(data.nome);
    setEtapa("codigo");
  }

  async function handleVerificarCodigo() {
    setErro(null);
    setVerificando(true);

    const telefoneLimpo = `+55${phone.replace(/\D/g, "")}`;

    const { data, error } = await supabase.functions.invoke("responsavel-verificar-codigo", {
      body: { telefone: telefoneLimpo, codigo },
    });

    if (error || data?.error) {
      setVerificando(false);
      setErro(data?.error ?? "Código incorreto. Tente novamente.");
      return;
    }

    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: "magiclink",
    });

    setVerificando(false);

    if (sessionError) {
      setErro("Não foi possível entrar. Peça um novo código.");
      return;
    }

    navigate({ to: "/familia" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-8 sm:py-12">
        <div>
          <button
            type="button"
            onClick={() => (etapa === "codigo" ? setEtapa("telefone") : navigate({ to: "/" }))}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 -ml-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Voltar
          </button>
        </div>

        {etapa === "telefone" ? (
          <section className="mt-8 flex flex-col">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Área da família
            </p>
            <h1
              className="mt-3 text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Entre sem senha, por SMS.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Vamos enviar um código de 6 dígitos por SMS para o seu celular.
            </p>

            {erro && (
              <div className="mt-6 rounded-md border border-emergency-border bg-emergency-surface px-4 py-3 text-sm text-foreground">
                {erro}
              </div>
            )}

            <form
              className="mt-10 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (telefoneValido) handleEnviarCodigo();
              }}
            >
              <label htmlFor="whatsapp" className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Número de celular
                </span>
                <div className="flex h-12 items-stretch overflow-hidden rounded-md border border-input bg-surface-elevated shadow-[var(--shadow-soft)] transition focus-within:border-ring focus-within:shadow-[var(--shadow-focus)]">
                  <div className="flex items-center gap-2 border-r border-border bg-surface px-3 text-[15px] font-medium text-foreground">
                    <span aria-hidden className="text-base leading-none">🇧🇷</span>
                    +55
                  </div>
                  <input
                    id="whatsapp"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="(11) 91234-5678"
                    value={masked}
                    onChange={(e) => setPhone(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={!telefoneValido || enviando}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-[15px] font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/92 active:bg-primary/88 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar código por SMS"}
              </button>

              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                O código chega em alguns segundos e expira em 10 minutos.
              </p>
            </form>
          </section>
        ) : (
          <section className="mt-8 flex flex-col">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Código enviado
            </p>
            <h1
              className="mt-3 text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Olá, {nome.split(" ")[0]}.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Digite o código de 6 dígitos que chegou por SMS em{" "}
              <span className="font-medium text-foreground">+55 {masked}</span>.
            </p>

            {erro && (
              <div className="mt-6 rounded-md border border-emergency-border bg-emergency-surface px-4 py-3 text-sm text-foreground">
                {erro}
              </div>
            )}

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (codigo.length === 6) handleVerificarCodigo();
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="h-16 w-full rounded-md border border-input bg-surface-elevated px-3 text-center text-3xl tracking-[0.4em] text-foreground shadow-[var(--shadow-soft)] outline-none focus:border-ring focus:shadow-[var(--shadow-focus)]"
              />

              <button
                type="submit"
                disabled={codigo.length !== 6 || verificando}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-[15px] font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/92 active:bg-primary/88 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
              >
                {verificando ? "Verificando..." : "Entrar"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEtapa("telefone");
                  setCodigo("");
                  setErro(null);
                }}
                className="block w-full text-center text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                Não recebeu? Pedir novo código
              </button>
            </form>
          </section>
        )}

        <footer className="mt-auto pt-16 text-center text-xs text-muted-foreground">
          <p>Dados protegidos conforme LGPD.</p>
        </footer>
      </div>
    </div>
  );
}
