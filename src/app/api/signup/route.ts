// src/app/api/signup/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      password,
      confirmPassword,
      jobType,
    }: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      jobType?: string;
    } = body;

    // validações simples
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { message: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "As senhas não conferem." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    // e-mail já existe?
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Já existe uma conta com esse e-mail." },
        { status: 409 }
      );
    }

    // gerar hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // criar usuário
    await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        jobType: jobType || null,
      },
    });

    return NextResponse.json(
      { message: "Conta criada com sucesso." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro no signup:", err);
    return NextResponse.json(
      { message: "Erro interno ao criar conta." },
      { status: 500 }
    );
  }
}
