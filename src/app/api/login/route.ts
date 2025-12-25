import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { message: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { message: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const res = NextResponse.json(
      {
        message: "Login realizado com sucesso.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          jobType: user.jobType,
        },
      },
      { status: 200 }
    );

    const sessionValue = `${user.id}`;
    const nowMs = Date.now().toString();

    // Cookie principal da sessão
    res.cookies.set("fx_session", sessionValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias (controle real é por timestamp)
    });

    // Cookie com horário da última atividade (para expiração em 30min)
    res.cookies.set("fx_session_last", nowMs, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { message: "Erro interno ao tentar fazer login." },
      { status: 500 }
    );
  }
}
