// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get("fx_session")?.value;

  const isStatic =
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff2?)$/) !== null;

  if (isStatic) {
    return NextResponse.next();
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isAuthApi =
    pathname.startsWith("/api/login") || pathname.startsWith("/api/signup");

  const isPublicPath = isAuthPage || isAuthApi;

  // Sem sessão → só pode acessar login / signup / apis de auth
  if (!session && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Com sessão → se tentar acessar login/signup, manda pra home
  if (session && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
