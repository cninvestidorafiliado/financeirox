// src/lib/storage.ts
// Storage robusto e "month-aware" para o FinanceiroX
// - Suporta criar/editar/excluir e listar por tipo dentro de um intervalo mensal
// - Datas em formato ISO "YYYY-MM-DD"

import type { Income, Expense } from "@/types/finance";

const LS_KEY = "fx_transactions_v1";

// ---- Eventos para reatividade leve (ex.: forçar reload em páginas) ----
const EVT = "fx:storage-change";
export function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT));
  }
}
export function subscribe(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}

// ---- Utilidades de datas ----
export function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

function parseISOToDate(iso: string): Date {
  // Garantir que "YYYY-MM-DD" converta sem fuso bagunçando
  const [y, m, d] = iso.split("-").map((n) => Number(n));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

// ---- CRUD base ----
export function listTransactions(): (Income | Expense)[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as (Income | Expense)[];
    // Sanitização leve
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveTransactions(arr: (Income | Expense)[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

export function upsertTransaction(tx: Income | Expense) {
  const all = listTransactions();
  const idx = all.findIndex((t) => t.id === tx.id);
  if (idx >= 0) {
    all[idx] = tx;
  } else {
    all.push(tx);
  }
  saveTransactions(all);
}

export function deleteTransaction(id: string) {
  const all = listTransactions().filter((t) => t.id !== id);
  saveTransactions(all);
}

// ---- Consultas ----
export function listByTypeInMonth(
  type: "INCOME" | "EXPENSE",
  range: { start: Date; end: Date }
): (Income | Expense)[] {
  const start = range.start.getTime();
  const end = range.end.getTime();
  return listTransactions()
    .filter((t) => t.type === type)
    .filter((t) => {
      const ts = parseISOToDate(t.occurredAt).getTime();
      return ts >= start && ts < end;
    })
    .sort((a, b) => {
      // Mais recentes por último para leitura cronológica
      const ta = parseISOToDate(a.occurredAt).getTime();
      const tb = parseISOToDate(b.occurredAt).getTime();
      return ta - tb;
    });
}

// src/lib/storage.ts
// ...demais imports e código que já te enviei

export function sumByTypeInMonth(
  type: "INCOME" | "EXPENSE",
  range: { start: Date; end: Date }
): number {
  return listByTypeInMonth(type, range).reduce(
    (acc, t) => acc + Number(t.amount),
    0
  );
}

// src/lib/storage.ts
// — Acrescenta listas de "Tipos de Origem" (ganhos) e "Categorias" (gastos)
// — Mantém todas as funções atuais (listTransactions, saveTransactions, etc.)

// TIPOS AUXILIARES (use os que já existem no seu storage e acrescente estes)
export type NamedItem = {
  id: string;
  name: string;
  color?: string;
  createdAt: string; // ISO
};

// chaves locais
const LS_KEYS = {
  incomeSources: "fx/incomeSources",
  expenseCategories: "fx/expenseCategories",
};

// utilitários locais de leitura/escrita
const read = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

const uid = () => Math.random().toString(36).slice(2, 9);

// ——— LISTAS: ORIGENS (GANHOS) ———————————————————————————————
export const listIncomeSources = (): NamedItem[] =>
  read<NamedItem[]>(LS_KEYS.incomeSources, []);

export const addIncomeSource = (name: string, color?: string) => {
  const list = listIncomeSources();
  const item: NamedItem = {
    id: uid(),
    name: name.trim(),
    color,
    createdAt: new Date().toISOString(),
  };
  write(LS_KEYS.incomeSources, [...list, item]);
  return item;
};

export const removeIncomeSource = (id: string) => {
  const next = listIncomeSources().filter((x) => x.id !== id);
  write(LS_KEYS.incomeSources, next);
};

// ——— LISTAS: CATEGORIAS (GASTOS) ———————————————————————————————
export const listExpenseCategories = (): NamedItem[] =>
  read<NamedItem[]>(LS_KEYS.expenseCategories, []);

export const addExpenseCategory = (name: string, color?: string) => {
  const list = listExpenseCategories();
  const item: NamedItem = {
    id: uid(),
    name: name.trim(),
    color,
    createdAt: new Date().toISOString(),
  };
  write(LS_KEYS.expenseCategories, [...list, item]);
  return item;
};

export const removeExpenseCategory = (id: string) => {
  const next = listExpenseCategories().filter((x) => x.id !== id);
  write(LS_KEYS.expenseCategories, next);
};

// (opcional) ajudante de cor
export const pickColor = (seed: number) => {
  const hues = [210, 160, 120, 90, 45, 280, 330];
  return `hsl(${hues[seed % hues.length]} 80% 60%)`;
};
