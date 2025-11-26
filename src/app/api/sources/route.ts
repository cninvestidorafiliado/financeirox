import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Kind = "INCOME" | "EXPENSE";

/**
 * Obtém o e-mail do usuário no modo single-user.
 * Usa FINX_SINGLE_USER_EMAIL do .env.
 */
async function getUserEmail(): Promise<string | null> {
  const email = process.env.FINX_SINGLE_USER_EMAIL;
  if (!email) {
    console.error("FINX_SINGLE_USER_EMAIL não configurado em /api/sources");
    return null;
  }
  return email;
}

// GET /api/sources?kind=INCOME|EXPENSE
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = (searchParams.get("kind") as Kind | null) ?? null;

    const email = await getUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    if (kind === "INCOME") {
      const sources = await prisma.incomeSource.findMany({
        where: { userEmail: email },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ kind: "INCOME", items: sources });
    }

    if (kind === "EXPENSE") {
      const categories = await prisma.expenseCategory.findMany({
        where: { userEmail: email },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ kind: "EXPENSE", items: categories });
    }

    // se não informar kind, envia os dois
    const [sources, categories] = await Promise.all([
      prisma.incomeSource.findMany({
        where: { userEmail: email },
        orderBy: { name: "asc" },
      }),
      prisma.expenseCategory.findMany({
        where: { userEmail: email },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      kind: "BOTH",
      incomeSources: sources,
      expenseCategories: categories,
    });
  } catch (error) {
    console.error("GET /api/sources falhou:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/sources
export async function POST(req: Request) {
  try {
    const email = await getUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, kind } = body as { name?: string; kind?: Kind };

    if (!name || !kind) {
      return NextResponse.json(
        { error: "Missing name or kind" },
        { status: 400 }
      );
    }

    if (kind === "INCOME") {
      const created = await prisma.incomeSource.create({
        data: { name, userEmail: email },
      });
      return NextResponse.json(created, { status: 201 });
    }

    if (kind === "EXPENSE") {
      const created = await prisma.expenseCategory.create({
        data: { name, userEmail: email },
      });
      return NextResponse.json(created, { status: 201 });
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

// DELETE /api/sources?id=...&kind=INCOME|EXPENSE
export async function DELETE(req: Request) {
  try {
    const email = await getUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    let kindParam = url.searchParams.get("kind") as Kind | null;

    // Se não vier na URL, tentamos pegar do body (DELETE com JSON)
    if (!id || !kindParam) {
      try {
        const body = (await req.json()) as { id?: string; kind?: Kind };
        if (!id && body?.id) {
          id = String(body.id);
        }
        if (!kindParam && body?.kind) {
          kindParam = body.kind;
        }
      } catch {
        // se não tiver body, ignoramos o erro
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    let deletedKind: Kind | null = null;

    // Se o tipo vier informado, tenta direto
    if (kindParam === "INCOME") {
      const source = await prisma.incomeSource.findUnique({ where: { id } });
      if (source && source.userEmail === email) {
        await prisma.incomeSource.delete({ where: { id } });
        deletedKind = "INCOME";
      }
    } else if (kindParam === "EXPENSE") {
      const category = await prisma.expenseCategory.findUnique({
        where: { id },
      });
      if (category && category.userEmail === email) {
        await prisma.expenseCategory.delete({ where: { id } });
        deletedKind = "EXPENSE";
      }
    }

    // Se ainda não deletou, tenta descobrir pelo id
    if (!deletedKind) {
      const source = await prisma.incomeSource.findUnique({ where: { id } });
      if (source && source.userEmail === email) {
        await prisma.incomeSource.delete({ where: { id } });
        deletedKind = "INCOME";
      } else {
        const category = await prisma.expenseCategory.findUnique({
          where: { id },
        });
        if (category && category.userEmail === email) {
          await prisma.expenseCategory.delete({ where: { id } });
          deletedKind = "EXPENSE";
        }
      }
    }

    if (!deletedKind) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, kind: deletedKind });
  } catch (error) {
    console.error("DELETE /api/sources falhou:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
