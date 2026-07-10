import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { IGREJA_ID, supabase } from "../lib/supabase";

export const Route = createFileRoute("/responsavel")({
  component: Responsavel,
});

function Responsavel() {
  const [sent, setSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [linkAcesso, setLinkAcesso] = useState("");

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
  const canSubmit = phone.replace(/\D/g, "").length >= 10;

  async function handleEnviar() {
    setErro(null);
    setEnviando(true);

    const telefoneLimpo = `+55${phone.replace(/\D/g, "")}`;

    const { data, error } = await supabase.functions.invoke("responsavel-magic-link", {
      body: { igreja_id: IGREJA_ID, telefone: telefoneLimpo },
    });

    setEnviando(false);

    if (error || data?.error) {
      setErro(data?.error ?? "Não foi possível enviar o link. Tente novamente.");
      return;
    }

    setNome(data.nome);
    setLinkAcesso(`${window.location.origin}/entrar?token_hash=${data.token_hash}&type=magiclink`);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-8 sm:py-12">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 -ml-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Voltar
          </Link>
        </div>

        {!sent ? (
          <RequestForm
            masked={masked}
            onChange={(v) => setPhone(v)}
            canSubmit={canSubmit}
            enviando={enviando}
            erro={erro}
            onSubmit={handleEnviar}
          />
        ) : (
          <SentState phone={masked} nome={nome} linkAcesso={linkAcesso} onResend={() => setSent(false)} />
        )}

        <footer className="mt-auto pt-16 text-center text-xs text-muted-foreground">
          <p>Dados protegidos conforme LGPD.</p>
        </footer>
      </div>
    </div>
  );
}

function RequestForm({
  masked,
  onChange,
  canSubmit,
  enviando,
  erro,
  onSubmit,
}: {
  masked: string;
  onChange: (v: string) => void;
  canSubmit: boolean;
  enviando: boolean;
  erro: string | null;
  onSubmit: () => void;
}) {
  return (
    <section className="mt-8 flex flex-col">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Área da família
      </p>
      <h1
        className="mt-3 text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Entre sem senha, pelo WhatsApp.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Vamos enviar um link seguro para o seu WhatsApp. Basta tocar no link para entrar na área da família.
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
          if (canSubmit) onSubmit();
        }}
      >
        <label htmlFor="whatsapp" className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Número de WhatsApp
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
              onChange={(e) => onChange(e.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={!canSubmit || enviando}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-[15px] font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/92 active:bg-primary/88 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
          </svg>
          {enviando ? "Enviando..." : "Enviar link por WhatsApp"}
        </button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          O link chega pelo WhatsApp em alguns segundos e expira em 10 minutos por segurança.
        </p>
      </form>
    </section>
  );
}

function SentState({
  phone,
  nome,
  linkAcesso,
  onResend,
}: {
  phone: string;
  nome: string;
  linkAcesso: string;
  onResend: () => void;
}) {
  return (
    <section className="mt-8 flex flex-col">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-full bg-accent text-primary"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Link enviado
        </p>
      </div>

      <h1
        className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Olá, {nome.split(" ")[0]}.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Enviamos um link seguro para <span className="font-medium text-foreground">+55 {phone}</span>. Toque no link para entrar. Ele expira em 10 minutos.
      </p>

      <WhatsAppPreview linkAcesso={linkAcesso} />

      <div className="mt-8 space-y-3 text-center">
        <button
          type="button"
          onClick={onResend}
          className="text-sm font-medium text-primary hover:underline underline-offset-4"
        >
          Não recebeu? Enviar de novo
        </button>
        <p className="text-xs text-muted-foreground">
          Se o número estiver errado, use "Voltar" para corrigir.
        </p>
      </div>
    </section>
  );
}

function WhatsAppPreview({ linkAcesso }: { linkAcesso: string }) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      {/* Barra do WhatsApp */}
      <div className="flex items-center gap-3 border-b border-border bg-surface-elevated px-4 py-3">
        <div
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-foreground">Sela</p>
          <p className="truncate text-xs text-muted-foreground">Conta verificada · agora</p>
        </div>
      </div>

      {/* Corpo com bolha */}
      <div
        className="px-4 py-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, oklch(0.9 0.008 80) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface-elevated p-3 shadow-[var(--shadow-soft)]">
          <p className="text-[13px] leading-relaxed text-foreground">
            Olá! Este é o seu link seguro para entrar na área da família do{" "}
            <span className="font-semibold">Sela</span>.
          </p>
          <a
            href={linkAcesso}
            className="mt-2 block rounded-lg border border-border bg-surface px-3 py-2 transition hover:border-primary/40"
          >
            <p className="truncate text-[12px] font-medium text-primary">{linkAcesso}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Toque para entrar · expira em 10 min
            </p>
          </a>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Se não foi você, ignore esta mensagem.
          </p>
          <p className="mt-1 text-right text-[10px] text-muted-foreground">agora ✓✓</p>
        </div>
      </div>

      <p className="border-t border-border bg-surface px-4 py-2.5 text-center text-[11px] text-muted-foreground">
        Envio real por WhatsApp chega em uma fase futura — por enquanto, o link acima já funciona de verdade.
      </p>
    </div>
  );
}
