export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Protege TUDO, exceto:
    // - /login  (página de login)
    // - /api/auth/* (rotas internas do NextAuth)
    // - /_next/* e favicon
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
