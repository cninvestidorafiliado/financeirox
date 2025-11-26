import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Kind = "INCOME" | "EXPENSE";

/**
 * Busca o e-mail do usuário no modo single-user.
 * Usa FINX_SINGLE_USER_EMAIL definida no .env/.env.local/Vercel.
 */
async function getUserEmail(): Promise<string | null> {
  const email = process.env.FINX_SINGLE_USER_EMAIL;
  if (!email) {
    console.error("FINX_SINGLE_USER_EMAIL não configurado em /api/sources");
    return null;
  }
  return email;
}

/**
 * GET /api/sources
 *
 * Query params opcionais:
 *  - kind=INCOME | EXPENSE
 *
 * Respostas:
 *  - kind=INCOME  -> { kind: "INCOME", incomeSources: [...] }
 *  - kind=EXPENSE -> { kind: "EXPENSE", expenseCategories: [...] }
 *  - sem kind     -> { kind: "BOTH", incomeSources: [...], expenseCategories: [...] }
 */
export async function GET(req: Request) {
  try {
    const email = await getUserEmail();
    if (!email) {
      return NextResponse.json(
        {
          error:
            "Usuário não configurado (FINX_SINGLE_USER_EMAIL ausente em /api/sources).",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const kindParam = url.searchParams.get("kind") as Kind | null;

    const wantIncome =
      !kindParam || (kindParam && kindParam.toUpperCase() === "INCOME");
    const wantExpense =
      !kindParam || (kindParam && kindParam.toUpperCase() === "EXPENSE");

    // >>> alteração aqui: sem let [], agora TS infere o tipo a partir do findMany
    const incomeSources = wantIncome
      ? await prisma.incomeSource.findMany({
          where: { userEmail: email },
          orderBy: { name: "asc" },
        })
      : [];

    const expenseCategories = wantExpense
      ? await prisma.expenseCategory.findMany({
          where: { userEmail: email },
          orderBy: { name: "asc" },
        })
      : [];
    // <<< fim da alteração

    if (kindParam === "INCOME") {
      return NextResponse.json({ kind: "INCOME", incomeSources });
    }

    if (kindParam === "EXPENSE") {
      return NextResponse.json({ kind: "EXPENSE", expenseCategories });
    }

    return NextResponse.json({
      kind: "BOTH",
      incomeSources,
      expenseCategories,
    });
  } catch (error) {
    console.error("GET /api/sources falhou:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sources
 *
 * Body:
 *  - kind: "INCOME" | "EXPENSE"
 *  - name: string
 *  - color?: string
 */
export async function POST(req: Request) {
  try {
    const email = await getUserEmail();
    if (!email) {
      return NextResponse.json(
        {
          error:
            "Usuário não configurado (FINX_SINGLE_USER_EMAIL ausente em /api/sources).",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const kind = body.kind as Kind | undefined;
    const name = (body.name as string | undefined)?.trim();
    const color = (body.color as string | undefined)?.trim() || null;

    if (!kind || (kind !== "INCOME" && kind !== "EXPENSE")) {
      return NextResponse.json(
        { error: "Campo 'kind' deve ser 'INCOME' ou 'EXPENSE'." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Campo 'name' é obrigatório." },
        { status: 400 }
      );
    }

    if (kind === "INCOME") {
      const created = await prisma.incomeSource.create({
        data: {
          userEmail: email,
          name,
          color,
        },
      });
      return NextResponse.json({ kind: "INCOME", source: created });
    }

    const created = await prisma.expenseCategory.create({
      data: {
        userEmail: email,
        name,
        color,
      },
    });
    return NextResponse.json({ kind: "EXPENSE", source: created });
  } catch (error) {
    console.error("POST /api/sources falhou:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sources?id=...&kind=...
 * (body opcional: { id, kind })
 */
export async function DELETE(req: Request) {
  try {
    const email = await getUserEmail();
    if (!email) {
      return NextResponse.json(
        {
          error:
            "Usuário não configurado (FINX_SINGLE_USER_EMAIL ausente em /api/sources).",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    let kindParam = url.searchParams.get("kind") as Kind | null;

    // se não vier na URL, tenta ler do body JSON
    if (!id || !kindParam) {
      try {
        const body = (await req.json()) as { id?: string; kind?: Kind };
        if (!id && body?.id) id = String(body.id);
        if (!kindParam && body?.kind) kindParam = body.kind ?? null;
      } catch {
        // se não tiver body, ignora
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (!kindParam || (kindParam !== "INCOME" && kindParam !== "EXPENSE")) {
      return NextResponse.json(
        { error: "Campo 'kind' deve ser 'INCOME' ou 'EXPENSE'." },
        { status: 400 }
      );
    }

    let deletedKind: Kind | null = null;

    if (kindParam === "INCOME") {
      const existing = await prisma.incomeSource.findFirst({
        where: { id, userEmail: email },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "IncomeSource não encontrado ou não pertence ao usuário." },
          { status: 404 }
        );
      }

      await prisma.incomeSource.delete({ where: { id } });
      deletedKind = "INCOME";
    } else if (kindParam === "EXPENSE") {
      const existing = await prisma.expenseCategory.findFirst({
        where: { id, userEmail: email },
      });

      if (!existing) {
        return NextResponse.json(
          {
            error: "ExpenseCategory não encontrado ou não pertence ao usuário.",
          },
          { status: 404 }
        );
      }

      await prisma.expenseCategory.delete({ where: { id } });
      deletedKind = "EXPENSE";
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
