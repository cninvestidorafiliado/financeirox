// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("fx_session")?.value;

    if (!session) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const userId = Number(session);
    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { message: "Sessão inválida." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        jobType: user.jobType,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro em /api/me:", error);
    return NextResponse.json(
      { message: "Erro interno ao carregar usuário." },
      { status: 500 }
    );
  }
}
