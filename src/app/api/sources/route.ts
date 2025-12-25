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

    // Busca no banco
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
  } catch (error: unknown) {
    console.error("GET /api/sources falhou:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sources
 *
 * Aceita:
 *  - JSON: { kind, name, color? }
 *  - multipart/form-data: kind, name, color?, paymentWeekday?, workWeekStart?, workWeekEnd?, icon?
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

    const contentType = req.headers.get("content-type") || "";

    let kind: Kind | undefined;
    let name: string | undefined;
    let color: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      // 🔹 Quando vem de um <form> com upload (FormData)
      const form = await req.formData();
      kind = (form.get("kind") as Kind | null) ?? undefined;
      name = (form.get("name") as string | null)?.trim();
      const rawColor = (form.get("color") as string | null)?.trim();
      color = rawColor && rawColor.length > 0 ? rawColor : null;

      // Campos extras (por enquanto só lidos, ainda não salvos em colunas)
      // const paymentWeekday = form.get("paymentWeekday");
      // const workWeekStart = form.get("workWeekStart");
      // const workWeekEnd = form.get("workWeekEnd");
      // const iconFile = form.get("icon") as File | null;
    } else {
      // 🔹 Padrão antigo: JSON
      const body = await req.json();
      kind = body.kind as Kind | undefined;
      name = (body.name as string | undefined)?.trim();
      const rawColor = (body.color as string | undefined)?.trim();
      color = rawColor && rawColor.length > 0 ? rawColor : null;
    }

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
  } catch (error: unknown) {
    console.error("POST /api/sources falhou:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: error instanceof Error ? error.message : String(error),
      },
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

    return NextResponse.json({ ok: true, kind: deletedKind });
  } catch (error: unknown) {
    console.error("DELETE /api/sources falhou:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
