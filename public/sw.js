// Service worker mínimo — por enquanto só o necessário para o app ser
// instalável (Android exige um SW registrado + ativo). Cache e push
// de notificação são fases futuras, adicionadas aqui depois sem
// precisar mexer no restante do app.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Passa todas as requisições direto pra rede — sem cache customizado
// ainda, pra não arriscar servir versão antiga do app por engano.
self.addEventListener("fetch", () => {});
