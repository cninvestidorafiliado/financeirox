// Middleware desativado temporariamente: nenhuma rota protegida.
export default function middleware() {
  // não faz nada, deixa todas as rotas passarem
}

export const config = {
  matcher: [], // sem rotas protegidas
};
