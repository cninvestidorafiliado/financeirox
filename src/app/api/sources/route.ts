import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

type Kind = "INCOME" | "EXPENSE";

/**
 * Descobre o e-mail do "dono" dos dados.
 * - Se tiver NextAuth configurado e o usuário estiver logado, usa o e-mail dele.
 * - Senão, usa FINX_SINGLE_USER_EMAIL (se existir).
 * - Se nada disso existir, usa um e-mail fixo local para modo single-user.
 */
async function getUserEmail(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return session.user.email;
    }
  } catch (err) {
    console.error("Erro ao obter sessão em /api/sources:", err);
  }

  if (process.env.FINX_SINGLE_USER_EMAIL) {
    return process.env.FINX_SINGLE_USER_EMAIL;
  }

  // fallback para ambiente sem login
  return "local@financeirox";
}

// ---------------------------------------------------------------------
// GET /api/sources
// Lista origens de ganho e categorias de gasto do usuário atual
// ---------------------------------------------------------------------
export async function GET() {
  try {
    const email = await getUserEmail();

    const incomeSources = await prisma.incomeSource.findMany({
      where: { userEmail: email },
      orderBy: { name: "asc" },
    });

    const expenseCategories = await prisma.expenseCategory.findMany({
      where: { userEmail: email },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      incomeSources,
      expenseCategories,
    });
  } catch (error) {
    console.error("GET /api/sources falhou:", error);
    // Mesmo em erro, devolve estrutura válida para não quebrar o front
    return NextResponse.json(
      { incomeSources: [], expenseCategories: [] },
      { status: 200 }
    );
  }
}

// ---------------------------------------------------------------------
// POST /api/sources
// Cria uma origem (INCOME) ou categoria (EXPENSE)
// body: { kind: "INCOME" | "EXPENSE", name: string }
// ---------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const email = await getUserEmail();
    const body = await req.json();

    const kind = body?.kind as Kind | undefined;
    const rawName = typeof body?.name === "string" ? body.name : "";
    const name = rawName.trim();

    if (!kind || !name) {
      return NextResponse.json({ error: "Missing kind/name" }, { status: 400 });
    }

    if (kind === "INCOME") {
      const item = await prisma.incomeSource.create({
        data: {
          userEmail: email,
          name,
        },
      });
      return NextResponse.json(item, { status: 201 });
    }

    if (kind === "EXPENSE") {
      const item = await prisma.expenseCategory.create({
        data: {
          userEmail: email,
          name,
        },
      });
      return NextResponse.json(item, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/sources falhou:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------
// DELETE /api/sources
// Exclui origem/categoria.
// Aceita:
//   - DELETE /api/sources?id=...&kind=INCOME|EXPENSE
//   - body: { id: string, kind?: "INCOME" | "EXPENSE" }
// ---------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const email = await getUserEmail();
    const url = new URL(req.url);

    let id = url.searchParams.get("id");
    let kind = url.searchParams.get("kind") as Kind | null;

    // tenta também ler do body
    try {
      const body = await req.json();
      if (!id && body?.id) id = String(body.id);
      if (!kind && body?.kind) kind = body.kind as Kind;
    } catch {
      // se não tiver body, tudo bem, segue só com query
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Se veio kind, tenta direto no modelo correspondente
    if (kind === "INCOME") {
      const item = await prisma.incomeSource.findUnique({ where: { id } });
      if (!item || item.userEmail !== email) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      await prisma.incomeSource.delete({ where: { id } });
      return NextResponse.json({ ok: true, kind: "INCOME" });
    }

    if (kind === "EXPENSE") {
      const item = await prisma.expenseCategory.findUnique({ where: { id } });
      if (!item || item.userEmail !== email) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      await prisma.expenseCategory.delete({ where: { id } });
      return NextResponse.json({ ok: true, kind: "EXPENSE" });
    }

    // Se não tiver kind, tenta descobrir automaticamente
    const income = await prisma.incomeSource.findUnique({ where: { id } });
    if (income && income.userEmail === email) {
      await prisma.incomeSource.delete({ where: { id } });
      return NextResponse.json({ ok: true, kind: "INCOME" });
    }

    const expense = await prisma.expenseCategory.findUnique({ where: { id } });
    if (expense && expense.userEmail === email) {
      await prisma.expenseCategory.delete({ where: { id } });
      return NextResponse.json({ ok: true, kind: "EXPENSE" });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("DELETE /api/sources falhou:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
