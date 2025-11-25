import { NextResponse } from "next/server";

/**
 * Rota de auth desativada temporariamente.
 * O app está funcionando sem NextAuth / login integrado.
 */
export function GET() {
  return NextResponse.json(
    { error: "Auth desativada. Login ainda não implementado." },
    { status: 404 }
  );
}

export const POST = GET;
