import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar configuradas."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Só usa localStorage no navegador — no servidor (SSR) isso não
    // existe, e passar undefined deixa o supabase-js usar um storage
    // "em memória" só pra aquela renderização, sem quebrar nada.
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// Sistema exclusivo da Igreja Virtude por enquanto (single-tenant).
// Quando virar multi-igreja de verdade, isso deixa de ser uma constante
// fixa e passa a vir de contexto (subdomínio, seleção no login, etc).
export const IGREJA_ID = (import.meta.env.VITE_IGREJA_ID as string)?.trim();
