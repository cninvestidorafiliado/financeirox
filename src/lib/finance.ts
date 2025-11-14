// src/lib/finance.ts

// (mantenha seus tipos/exports atuais)
export type TransactionType = "INCOME" | "EXPENSE";
export type Currency = "JPY" | "BRL";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  occurredAt: string; // YYYY-MM-DD
  notes?: string;
}
export interface Income extends Transaction {
  type: "INCOME";
  incomeSource: string;
}
export interface Expense extends Transaction {
  type: "EXPENSE";
  expenseCategory: string;
  payMethod: "CASH" | "CREDIT_CARD" | "APP";
  payApp?: string;
}

/**
 * Formatter determinístico de JPY, evitando Intl (que varia entre SSR e cliente).
 * - Sempre usa "¥" (U+00A5)
 * - Separador de milhar fixo: ","
 * - Aceita números negativos
 */
export function formatJPYStable(value: number, opts?: { withSign?: boolean }) {
  const withSign = !!opts?.withSign;
  const neg = Number(value) < 0;
  const abs = Math.abs(Math.round(Number(value) || 0));
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // 12,345,678
  const core = `¥${s}`;
  if (!withSign) return neg ? `-${core}` : core;
  return `${neg ? "-" : "+"}${core}`;
}

// (se quiser manter o antigo para outros pontos do app)
export function formatJPY(value: number) {
  // OBS.: Evite usar este em UI SSR/CSR mista; prefira formatJPYStable
  return value.toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
}
