// middleware.ts
// Middleware desativado: nenhuma rota é protegida.
// Isso deixa o app totalmente aberto enquanto preparamos o novo sistema de login.

export default function middleware() {
  // no-op
}

export const config = {
  matcher: [] as string[], // nenhuma rota
};
