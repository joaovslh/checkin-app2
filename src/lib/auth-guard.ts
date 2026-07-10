import { redirect } from "@tanstack/react-router";
import { supabase } from "./supabase";

/**
 * Usar em beforeLoad das rotas internas da equipe (painel, checkin,
 * equipe-cadastro, emergencia, relatorios). Se não houver sessão
 * ativa, redireciona para o portal inicial antes mesmo de renderizar
 * a tela — evita que alguém acesse digitando a URL direto.
 */
export async function requireEquipeSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/" });
  }
}

/**
 * Usar em beforeLoad da rota /familia. Se não houver sessão ativa,
 * volta para a tela de pedir o link de acesso.
 */
export async function requireResponsavelSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/responsavel" });
  }
}
