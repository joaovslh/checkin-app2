import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { registrarMomentoDoLogin } from "../lib/auth-guard";
import { IGREJA_ID, supabase } from "../lib/supabase";

export const Route = createFileRoute("/responsavel")({
  component: Responsavel,
});

function Responsavel() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [entrando, setEntrando] = useState(false);
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
  const podeEntrar = phone.replace(/\D/g, "").length >= 10 && sobrenome.trim().length > 0;

  async function handleEntrar() {
    setErro(null);
    setEntrando(true);

    const telefoneLimpo = `+55${phone.replace(/\D/g, "")}`;

    const { data, error } = await supabase.functions.invoke("responsavel-login-direto", {
      body: { igreja_id: IGREJA_ID, telefone: telefoneLimpo, sobrenome: sobrenome.trim() },
    });

    if (error || data?.error) {
      setEntrando(false);
      setErro(data?.error ?? "Não foi possível entrar. Tente novamente.");
      return;
    }

    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: "magiclink",
    });

    setEntrando(false);

    if (sessionError) {
      setErro("Não foi possível entrar. Tente novamente.");
      return;
    }

    registrarMomentoDoLogin();
    navigate({ to: "/familia" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-8 sm:py-12">
        <div>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 -ml-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Voltar
          </button>
        </div>

        <section className="mt-8 flex flex-col">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Área da família
          </p>
          <h1
            className="mt-3 text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Entre com seu telefone.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Confirme o telefone e sobrenome usados no cadastro do seu filho.
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
              if (podeEntrar) handleEntrar();
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

            <label htmlFor="sobrenome" className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Seu sobrenome
              </span>
              <input
                id="sobrenome"
                type="text"
                autoComplete="family-name"
                placeholder=""
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                className="h-12 w-full rounded-md border border-input bg-surface-elevated px-3 text-[15px] text-foreground shadow-[var(--shadow-soft)] outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:shadow-[var(--shadow-focus)]"
              />
            </label>

            <button
              type="submit"
              disabled={!podeEntrar || entrando}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-[15px] font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/92 active:bg-primary/88 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
            >
              {entrando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </section>

        <footer className="mt-auto pt-16 text-center text-xs text-muted-foreground">
          <p>Dados protegidos conforme LGPD.</p>
        </footer>
      </div>
    </div>
  );
}
