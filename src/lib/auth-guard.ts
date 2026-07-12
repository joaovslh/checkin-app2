import { redirect } from "@tanstack/react-router";
import { supabase } from "./supabase";

/**
 * Usar em beforeLoad das rotas internas da equipe (painel, checkin,
 * equipe-cadastro, emergencia, relatorios). Se não houver sessão
 * ativa, redireciona para o portal inicial antes mesmo de renderizar
 * a tela — evita que alguém acesse digitando a URL direto.
 *
 * A sessão fica guardada só no navegador (localStorage), então essa
 * checagem só faz sentido rodando no cliente — durante o SSR (quando
 * o servidor pré-renderiza a página) ela sempre pareceria "deslogada",
 * mesmo com sessão válida guardada no celular da pessoa.
 */
export async function requireEquipeSession() {
  if (typeof window === "undefined") return; // pula durante SSR

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/" });
  }
}

/**
 * Usar em beforeLoad da rota /familia. Se não houver sessão ativa,
 * volta para a tela de pedir o código de acesso.
 */
export async function requireResponsavelSession() {
  if (typeof window === "undefined") return; // pula durante SSR

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/responsavel" });
  }
}
