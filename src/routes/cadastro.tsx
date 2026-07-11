import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { IGREJA_ID, supabase } from "../lib/supabase";

export const Route = createFileRoute("/cadastro")({
  component: Cadastro,
});

function Cadastro() {
  const [phone, setPhone] = useState("");
  const [nomeCrianca, setNomeCrianca] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [alergia, setAlergia] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const telefoneDigits = phone.replace(/\D/g, "");
    if (telefoneDigits.length < 10) {
      setErro("Confira o número de WhatsApp digitado.");
      return;
    }

    setEnviando(true);

    const { data, error } = await supabase.functions.invoke("autocadastro", {
      body: {
        igreja_id: IGREJA_ID,
        responsavel: {
          nome: nomeResponsavel,
          telefone: `+55${telefoneDigits}`,
        },
        crianca: {
          nome: nomeCrianca,
          data_nascimento: dataNascimento,
          alergias: alergia.trim() ? [alergia.trim()] : [],
        },
        consentimento_termos_gerais: true,
        consentimento_biometria: false,
      },
    });

    setEnviando(false);

    if (error || data?.error) {
      setErro(data?.error ?? "Não foi possível concluir o cadastro. Tente novamente.");
      return;
    }

    setConcluido(true);
  }

  if (concluido) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-8 text-center">
          <div
            aria-hidden
            className="grid h-14 w-14 place-items-center rounded-full bg-accent text-primary"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1
            className="mt-5 text-3xl font-semibold leading-[1.15] tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cadastro concluído!
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
            {nomeCrianca} já está no sistema. No dia do culto, procure a equipe na entrada para o primeiro check-in.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface-elevated px-5 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
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

        <section className="mt-8 flex flex-col">
          <div
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-xl border border-dashed border-border bg-surface text-primary"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3" />
              <path d="M21 14v.01" />
              <path d="M14 21h.01" />
              <path d="M17 17h4v4" />
            </svg>
          </div>

          <h1
            className="mt-5 text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cadastro rápido
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Leva menos de 1 minuto. Nenhum dado de saúde é obrigatório.
          </p>

          {erro && (
            <div className="mt-6 rounded-md border border-emergency-border bg-emergency-surface px-4 py-3 text-sm text-foreground">
              {erro}
            </div>
          )}

          <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
            <Field label="Nome da criança" htmlFor="child-name">
              <TextInput
                id="child-name"
                required
                value={nomeCrianca}
                onChange={(e) => setNomeCrianca(e.target.value)}
                placeholder="Ex: Laura Mendonça"
                autoComplete="off"
              />
            </Field>

            <Field label="Data de nascimento" htmlFor="child-dob">
              <TextInput
                id="child-dob"
                required
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </Field>

            <Field label="Seu nome (responsável)" htmlFor="guardian-name">
              <TextInput
                id="guardian-name"
                required
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                placeholder="Ex: Ana Mendonça"
                autoComplete="name"
              />
            </Field>

            <Field label="Seu WhatsApp" htmlFor="guardian-phone">
              <div className="flex h-11 items-stretch overflow-hidden rounded-md border border-input bg-surface-elevated shadow-[var(--shadow-soft)] transition focus-within:border-ring focus-within:shadow-[var(--shadow-focus)]">
                <div className="flex items-center gap-2 border-r border-border bg-surface px-3 text-[15px] font-medium text-foreground">
                  <span aria-hidden className="text-base leading-none">🇧🇷</span>
                  +55
                </div>
                <input
                  id="guardian-phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="(11) 91234-5678"
                  value={formatBR(phone)}
                  onChange={(e) => setPhone(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
                />
              </div>
            </Field>

            <Field
              label="Alguma alergia?"
              htmlFor="allergy"
              aside={<span className="text-xs font-medium text-muted-foreground">Opcional</span>}
            >
              <TextInput
                id="allergy"
                value={alergia}
                onChange={(e) => setAlergia(e.target.value)}
                placeholder="Ex: amendoim"
                autoComplete="off"
              />
            </Field>

            <div className="pt-2">
              <button
                type="submit"
                disabled={enviando}
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-5 text-[15px] font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/92 active:bg-primary/88 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Concluir cadastro"}
              </button>
              <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                Ao continuar, você concorda com os{" "}
                <a href="#" className="font-medium text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground">
                  termos de uso
                </a>{" "}
                do Virtude Kids.
              </p>
            </div>
          </form>
        </section>

        <footer className="mt-auto pt-16 text-center text-xs text-muted-foreground">
          <p>Dados protegidos conforme LGPD.</p>
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
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
