import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/entrar")({
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function verificar() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (!tokenHash || !type) {
        setErro("Link inválido ou incompleto.");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "magiclink",
      });

      if (error) {
        setErro("Esse link expirou ou já foi usado. Peça um novo acesso.");
        return;
      }

      navigate({ to: "/familia" });
    }
    verificar();
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
      {erro ? (
        <div>
          <p className="text-base font-medium text-foreground">{erro}</p>
          <a
            href="/responsavel"
            className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
          >
            Pedir novo link
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Entrando...</p>
      )}
    </div>
  );
}
