// src/types/finance.ts

export type TransactionType = "INCOME" | "EXPENSE";

export type PaymentMethod = "CASH" | "CREDIT_CARD" | "APP" | null;

export interface BaseTransaction {
  id: string;
  type: TransactionType;
  amount: number; // em JPY por enquanto
  occurredAt: string; // YYYY-MM-DD
  notes?: string | null;
}

export interface Income extends BaseTransaction {
  type: "INCOME";
  incomeSource: "Amazon" | "Uber" | "Outros";
  // campos de gasto ficam null
  expenseCategory?: never;
  payMethod?: never;
  payApp?: never;
}

export interface Expense extends BaseTransaction {
  type: "EXPENSE";
  expenseCategory: string; // Posto, Troca de óleo, etc.
  payMethod: PaymentMethod; // dinheiro/cartão/app
  payApp: string | null; // qual app (PayPay, Suica, etc.)
  // campos de ganho ficam null
  incomeSource?: never;
}

export type Transaction = Income | Expense;

export interface MonthRange {
  start: string; // YYYY-MM-01
  end: string; // YYYY-MM-31 (ou último dia)
}
