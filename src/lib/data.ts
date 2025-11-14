import { supabase, hasSupabase } from "./supabase";

export type TxType = "INCOME" | "EXPENSE";
export type Transaction = {
  id: string;
  type: TxType;
  occurredAt: string; // ISO
  amount: number;
  // despesas
  expenseCategory?: string;
  paymentMethod?: string;
  paymentDetail?: string;
  // ganhos
  incomeSource?: string;
  receiptMethod?: string;
  receiptDetail?: string;
  // comum
  notes?: string;
  createdAt?: string;
};

export function getMonthRange(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  return { start, end };
}

/* ---------- LOCAL (fallback) ---------- */
const LS_KEY = "fx_transactions_v1";
function lsReadAll(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}
function lsWriteAll(list: Transaction[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function listByTypeInMonth_local(
  type: TxType,
  range: { start: Date; end: Date }
) {
  return lsReadAll().filter((t) => {
    if (t.type !== type) return false;
    const d = new Date(t.occurredAt);
    return d >= range.start && d < range.end;
  });
}
export async function addTransaction_local(tx: Transaction) {
  const all = lsReadAll();
  all.push(tx);
  lsWriteAll(all);
  return tx;
}

/* ---------- SUPABASE (cloud) ---------- */
function rowToTx(r: any): Transaction {
  return {
    id: r.id,
    type: r.type,
    occurredAt: r.occurred_at,
    amount: Number(r.amount),
    expenseCategory: r.expense_category ?? undefined,
    paymentMethod: r.payment_method ?? undefined,
    paymentDetail: r.payment_detail ?? undefined,
    incomeSource: r.income_source ?? undefined,
    receiptMethod: r.receipt_method ?? undefined,
    receiptDetail: r.receipt_detail ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  };
}
async function getUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Precisa estar logado para sincronizar.");
  return user.id;
}

export async function listByTypeInMonth_cloud(
  type: TxType,
  range: { start: Date; end: Date }
) {
  await getUserId(); // garante auth ativa
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("type", type)
    .gte("occurred_at", range.start.toISOString())
    .lt("occurred_at", range.end.toISOString())
    .order("occurred_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToTx);
}

export async function addTransaction_cloud(tx: Transaction) {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id,
      type: tx.type,
      occurred_at: tx.occurredAt,
      amount: tx.amount,
      expense_category: tx.expenseCategory,
      payment_method: tx.paymentMethod,
      payment_detail: tx.paymentDetail,
      income_source: tx.incomeSource,
      receipt_method: tx.receiptMethod,
      receipt_detail: tx.receiptDetail,
      notes: tx.notes,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToTx(data);
}

/* ---------- API pública usada pelas telas ---------- */
export async function listByTypeInMonth(
  type: TxType,
  range: { start: Date; end: Date }
) {
  if (hasSupabase) return listByTypeInMonth_cloud(type, range);
  return listByTypeInMonth_local(type, range);
}
export async function addTransaction(tx: Transaction) {
  if (hasSupabase) return addTransaction_cloud(tx);
  return addTransaction_local(tx);
}

/* ---------- Realtime ---------- */
export function subscribeTransactions(onChange: () => void) {
  if (!hasSupabase) return () => {};
  const channel = supabase
    .channel("realtime:transactions")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "transactions" },
      onChange
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
