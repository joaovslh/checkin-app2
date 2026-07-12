import { redirect } from "@tanstack/react-router";
import { supabase } from "./supabase";

const CHAVE_LOGIN_EM = "sela_login_em";
const VINTE_QUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

/**
 * Chame isso logo depois de um login bem-sucedido (equipe ou
 * responsável) — grava o horário exato, usado depois pra forçar
 * logout automático em 24h.
 */
export function registrarMomentoDoLogin() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE_LOGIN_EM, Date.now().toString());
}

/**
 * Confere se já passou 24h desde o login. Se passou, desloga e
 * limpa o registro — devolve true nesse caso (sessão expirada).
 */
async function sessaoExpirou(): Promise<boolean> {
  const registrado = window.localStorage.getItem(CHAVE_LOGIN_EM);

  // Sessão antiga, de antes dessa regra existir — registra agora e
  // dá mais 24h a partir daqui, em vez de derrubar todo mundo de uma vez.
  if (!registrado) {
    registrarMomentoDoLogin();
    return false;
  }

  const loginEm = Number(registrado);
  if (Number.isNaN(loginEm)) {
    registrarMomentoDoLogin();
    return false;
  }

  if (Date.now() - loginEm > VINTE_QUATRO_HORAS_MS) {
    await supabase.auth.signOut();
    window.localStorage.removeItem(CHAVE_LOGIN_EM);
    return true;
  }

  return false;
}

/**
 * Usar em beforeLoad das rotas internas da equipe (painel, checkin,
 * equipe-cadastro, emergencia, relatorios). Se não houver sessão
 * ativa, ou se já passou 24h desde o login, redireciona para o
 * portal inicial antes mesmo de renderizar a tela.
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

  if (await sessaoExpirou()) {
    throw redirect({ to: "/" });
  }
}

/**
 * Usar em beforeLoad da rota /familia. Se não houver sessão ativa,
 * ou se já passou 24h desde o login, volta para a tela de pedir o
 * código de acesso.
 */
export async function requireResponsavelSession() {
  if (typeof window === "undefined") return; // pula durante SSR

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/responsavel" });
  }

  if (await sessaoExpirou()) {
    throw redirect({ to: "/responsavel" });
  }
}
