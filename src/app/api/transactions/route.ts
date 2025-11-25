import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TxType = "INCOME" | "EXPENSE";

/**
 * Obtém o e-mail do usuário:
 * usa apenas FINX_SINGLE_USER_EMAIL (modo single-user)
 */
async function getUserEmail(): Promise<string | null> {
  if (process.env.FINX_SINGLE_USER_EMAIL) {
    return process.env.FINX_SINGLE_USER_EMAIL;
  }
  console.error("FINX_SINGLE_USER_EMAIL não configurado em /api/transactions");
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

// ======================================================
// GET /api/transactions
// ======================================================
export async function GET(req: Request) {
  try {
    const email = await getUserEmail();

    // Se por algum motivo não tiver e-mail, devolve array vazio
    if (!email) {
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
    return NextResponse.json([]);
  }
}

// ======================================================
// POST /api/transactions
// ======================================================
export async function POST(req: Request) {
  try {
    const email = await getUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const type = body?.type === "INCOME" ? "INCOME" : "EXPENSE";

    // Valor
    const amountNumber = Number(body?.amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    // Data
    const occurredAt = body?.occurredAt
      ? new Date(body.occurredAt)
      : new Date();

    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    // Observações
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

// ======================================================
// PUT /api/transactions?id=...
// ======================================================
export async function PUT(req: Request) {
  try {
    const email = await getUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await req.json();

    const existing = await prisma.transaction.findFirst({
      where: { id, userEmail: email },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data: any = {};

    if (body?.amount !== undefined) {
      const amountNumber = Number(body.amount);
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
      }
      data.amount = amountNumber;
    }

    if (body?.occurredAt) {
      const occurredAt = new Date(body.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) {
        return NextResponse.json({ error: "Data inválida" }, { status: 400 });
      }
      data.occurredAt = occurredAt;
    }

    if (body?.notes !== undefined) {
      data.notes =
        typeof body.notes === "string" && body.notes.trim().length > 0
          ? body.notes.trim()
          : null;
    }

    if (body?.type === "INCOME" || body?.type === "EXPENSE") {
      data.type = body.type;
    }

    const type = data.type ?? existing.type;

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

// ======================================================
// DELETE /api/transactions?id=...
// ======================================================
export async function DELETE(req: Request) {
  try {
    const email = await getUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userEmail: email },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
