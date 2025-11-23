import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

type TxType = "INCOME" | "EXPENSE";

async function tryGetUserEmail(): Promise<string | null> {
  // 1) Tenta pegar do NextAuth
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return session.user.email;
    }
  } catch (err) {
    console.error("Erro ao obter sessão em /api/transactions:", err);
  }

  // 2) Fallback single-user via variável de ambiente (opcional)
  if (process.env.FINX_SINGLE_USER_EMAIL) {
    return process.env.FINX_SINGLE_USER_EMAIL;
  }

  return null;
}

function parseDateRange(url: URL) {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from && !to) return undefined;

  const range: { gte?: Date; lte?: Date } = {};

  if (from) {
    range.gte = new Date(from + "T00:00:00.000Z");
  }
  if (to) {
    range.lte = new Date(to + "T23:59:59.999Z");
  }

  return range;
}

// ---------------------------------------------------------------------
// GET /api/transactions
// Retorna um array de transações, filtrando por usuário, tipo e período
// ---------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const email = await tryGetUserEmail();

    if (!email) {
      // se não tem usuário, devolve array vazio para não quebrar o front
      return NextResponse.json([]);
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") as TxType | null;
    const dateRange = parseDateRange(url);

    const where: any = { userEmail: email };

    if (type === "INCOME" || type === "EXPENSE") {
      where.type = type;
    }

    if (dateRange) {
      where.occurredAt = dateRange;
    }

    const items = await prisma.transaction.findMany({
      where,
      orderBy: { occurredAt: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/transactions falhou:", error);
    // Em caso de erro, devolve array vazio para não quebrar BarChart/ligação
    return NextResponse.json([]);
  }
}

// ---------------------------------------------------------------------
// POST /api/transactions
// Compatível com AddTransactionForm (ganhos e gastos)
// ---------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const email = await tryGetUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const type = body?.type as TxType | undefined;
    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const occurredAtStr = String(body?.occurredAt ?? "");
    let occurredAt = new Date(occurredAtStr);
    if (isNaN(occurredAt.getTime())) {
      occurredAt = new Date();
    }

    const amountNumber = Number(body?.amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const notes =
      typeof body?.notes === "string" && body.notes.trim().length > 0
        ? body.notes.trim()
        : null;

    const data: any = {
      userEmail: email,
      type,
      occurredAt,
      amount: amountNumber,
      notes,
    };

    if (type === "INCOME") {
      data.incomeSource =
        typeof body?.incomeSource === "string" && body.incomeSource.trim()
          ? body.incomeSource.trim()
          : null;
      data.receiptMethod =
        typeof body?.receiptMethod === "string" && body.receiptMethod.trim()
          ? body.receiptMethod.trim()
          : null;
      data.receiptDetail =
        typeof body?.receiptDetail === "string" && body.receiptDetail.trim()
          ? body.receiptDetail.trim()
          : null;
    } else {
      data.expenseCategory =
        typeof body?.expenseCategory === "string" && body.expenseCategory.trim()
          ? body.expenseCategory.trim()
          : null;
      data.payMethod =
        typeof body?.payMethod === "string" && body.payMethod.trim()
          ? body.payMethod.trim()
          : null;
      data.payApp =
        typeof body?.payApp === "string" && body.payApp.trim()
          ? body.payApp.trim()
          : null;
    }

    const created = await prisma.transaction.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions falhou:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------
// PUT /api/transactions
// Atualiza uma transação existente
// ---------------------------------------------------------------------
export async function PUT(req: Request) {
  try {
    const email = await tryGetUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const id = String(body?.id ?? "");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const type = body?.type as TxType | undefined;
    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const occurredAtStr = String(body?.occurredAt ?? "");
    let occurredAt = new Date(occurredAtStr);
    if (isNaN(occurredAt.getTime())) {
      occurredAt = new Date();
    }

    const amountNumber = Number(body?.amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const notes =
      typeof body?.notes === "string" && body.notes.trim().length > 0
        ? body.notes.trim()
        : null;

    const data: any = {
      type,
      occurredAt,
      amount: amountNumber,
      notes,
    };

    if (type === "INCOME") {
      data.incomeSource =
        typeof body?.incomeSource === "string" && body.incomeSource.trim()
          ? body.incomeSource.trim()
          : null;
      data.receiptMethod =
        typeof body?.receiptMethod === "string" && body.receiptMethod.trim()
          ? body.receiptMethod.trim()
          : null;
      data.receiptDetail =
        typeof body?.receiptDetail === "string" && body.receiptDetail.trim()
          ? body.receiptDetail.trim()
          : null;

      // limpa campos de despesa
      data.expenseCategory = null;
      data.payMethod = null;
      data.payApp = null;
    } else {
      data.expenseCategory =
        typeof body?.expenseCategory === "string" && body.expenseCategory.trim()
          ? body.expenseCategory.trim()
          : null;
      data.payMethod =
        typeof body?.payMethod === "string" && body.payMethod.trim()
          ? body.payMethod.trim()
          : null;
      data.payApp =
        typeof body?.payApp === "string" && body.payApp.trim()
          ? body.payApp.trim()
          : null;

      // limpa campos de ganho
      data.incomeSource = null;
      data.receiptMethod = null;
      data.receiptDetail = null;
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/transactions falhou:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------
// DELETE /api/transactions?id=...
// ---------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const email = await tryGetUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/transactions falhou:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
