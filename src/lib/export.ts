// src/lib/export.ts
import type { Transaction } from "@/types/finance";

function toCSV(rows: Record<string, any>[], headers: string[]): string {
  const esc = (v: any) => {
    const s = v ?? "";
    const str = String(s);
    if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const head = headers.join(";");
  const body = rows
    .map((r) => headers.map((h) => esc(r[h])).join(";"))
    .join("\n");
  return head + "\n" + body;
}

export function download(
  filename: string,
  content: string,
  type = "text/csv;charset=utf-8"
) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsCSV(name: string, list: Transaction[]) {
  // cabeçalhos genéricos que servem para ambos tipos
  const headers = [
    "type",
    "occurredAt",
    "amount",
    "incomeSource",
    "expenseCategory",
    "payMethod",
    "payApp",
    "notes",
    "id",
  ];
  const rows = list.map((t) => ({
    type: t.type,
    occurredAt: t.occurredAt,
    amount: Number(t.amount).toFixed(2),
    incomeSource: (t as any).incomeSource ?? "",
    expenseCategory: (t as any).expenseCategory ?? "",
    payMethod: (t as any).payMethod ?? "",
    payApp: (t as any).payApp ?? "",
    notes: t.notes ?? "",
    id: t.id,
  }));
  const csv = toCSV(rows, headers);
  download(`${name}.csv`, csv);
}
