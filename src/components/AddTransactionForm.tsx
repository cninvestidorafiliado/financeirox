"use client";

import { useEffect, useState } from "react";
import {
  listTransactions,
  saveTransactions,
  emitChange,
  listIncomeSources,
  listExpenseCategories,
  type NamedItem,
} from "@/lib/storage";
import type { Income, Expense } from "@/types/finance";
import { randomId } from "@/lib/id";

type TxType = "INCOME" | "EXPENSE";
type PayMethod = "CASH" | "CREDIT_CARD" | "APP";

/** Forma de recebimento para ganhos */
type ReceiptMethod = "CASH" | "BANK" | "APP";

/** Income local com campos extras (somente dentro deste arquivo) */
type IncomeWithReceipt = Income & {
  receiptMethod?: ReceiptMethod;
  receiptDetail?: string;
};

type AnyTx = IncomeWithReceipt | Expense;

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function AddTransactionForm({
  type,
  onSaved,
}: {
  type: TxType;
  onSaved?: (tx: Income | Expense) => void;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [extra, setExtra] = useState(""); // origem (ganho) / categoria (gasto)
  const [occurredAt, setOccurredAt] = useState(todayISO());

  // Gastos
  const [payMethod, setPayMethod] = useState<PayMethod>("CASH");
  const [payApp, setPayApp] = useState("");

  // Ganhos
  const [receiptMethod, setReceiptMethod] = useState<ReceiptMethod>("CASH");
  const [receiptDetail, setReceiptDetail] = useState("");

  const [incomeSources, setIncomeSources] = useState<NamedItem[] | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<
    NamedItem[] | null
  >(null);

  useEffect(() => {
    setIncomeSources(listIncomeSources());
    setExpenseCategories(listExpenseCategories());
  }, []);

  const resetForm = () => {
    setAmount("");
    setNotes("");
    setExtra("");
    setOccurredAt(todayISO());
    setPayMethod("CASH");
    setPayApp("");
    setReceiptMethod("CASH");
    setReceiptDetail("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      alert("Digite um valor válido (> 0).");
      return;
    }
    if (!extra.trim()) {
      alert(
        type === "INCOME"
          ? "Informe a origem do ganho."
          : "Informe a categoria do gasto."
      );
      return;
    }
    if (!occurredAt) {
      alert("Escolha a data do lançamento.");
      return;
    }

    // ---------- monta o objeto da transação (apenas local) ----------
    let tx: AnyTx;

    if (type === "INCOME") {
      tx = {
        id: randomId(),
        type: "INCOME",
        amount: numeric,
        occurredAt,
        notes: notes.trim() || undefined,
        incomeSource: extra.trim(),
        receiptMethod,
        receiptDetail:
          receiptMethod === "BANK" || receiptMethod === "APP"
            ? receiptDetail.trim() || undefined
            : undefined,
      } as IncomeWithReceipt;
    } else {
      tx = {
        id: randomId(),
        type: "EXPENSE",
        amount: numeric,
        occurredAt,
        notes: notes.trim() || undefined,
        expenseCategory: extra.trim(),
        payMethod,
        payApp: payMethod === "APP" ? payApp.trim() || undefined : undefined,
      } as Expense;
    }

    // ============ SOMENTE LOCALSTORAGE (sem Supabase) ============
    const all = listTransactions();
    all.push(tx as unknown as Income | Expense);
    saveTransactions(all);

    try {
      emitChange?.();
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("finx:transactions-changed"));
      window.dispatchEvent(new Event("finx:storage"));
    }

    onSaved?.(tx as Income | Expense);
    resetForm();
  };

  const options =
    type === "INCOME" ? incomeSources ?? [] : expenseCategories ?? [];
  const showSelect =
    (type === "INCOME" ? incomeSources : expenseCategories) !== null &&
    options.length > 0;

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "grid", gap: 10, width: "100%" }}
    >
      {/* CSS para inputs ficarem bons no celular */}
      <style jsx>{`
        input[type="date"],
        select {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          font-size: 16px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background-color: #fff;
          appearance: none;
        }
        input,
        textarea {
          font-family: inherit;
        }
        @media (max-width: 768px) {
          input[type="date"],
          select {
            font-size: 15px;
            padding: 8px;
          }
        }
        input[type="number"],
        input[type="text"] {
          width: 100%;
          box-sizing: border-box;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        small {
          font-size: 13px;
        }
        button.btn {
          margin-top: 6px;
          height: 45px;
          font-size: 18px;
          font-weight: 600;
          background-color: #2563eb;
          color: white;
          border-radius: 10px;
          border: none;
          transition: 0.2s;
        }
        button.btn:hover {
          background-color: #1d4ed8;
        }
      `}</style>

      <label>
        Data
        <input
          type="date"
          required
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
      </label>

      <label>
        Valor
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex.: 500"
        />
      </label>

      {/* ===== GANHOS ===== */}
      {type === "INCOME" ? (
        <>
          <label>
            Origem
            {showSelect ? (
              <select value={extra} onChange={(e) => setExtra(e.target.value)}>
                <option value="" disabled>
                  Selecione...
                </option>
                {options.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="text"
                  required
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Ex.: Salário, Amazon, Uber…"
                />
                <small style={{ color: "#6b7280" }}>
                  Dica: cadastre as origens na página <b>Ganhos</b> para virar
                  uma lista.
                </small>
              </>
            )}
          </label>

          <label>
            Forma de Recebimento
            <select
              value={receiptMethod}
              onChange={(e) =>
                setReceiptMethod(e.target.value as ReceiptMethod)
              }
            >
              <option value="CASH">Em mãos</option>
              <option value="BANK">Conta Bancária</option>
              <option value="APP">Por Aplicativo</option>
            </select>
          </label>

          {(receiptMethod === "BANK" || receiptMethod === "APP") && (
            <label>
              {receiptMethod === "BANK"
                ? "Nome do banco"
                : "Nome do aplicativo"}
              <input
                type="text"
                value={receiptDetail}
                onChange={(e) => setReceiptDetail(e.target.value)}
                placeholder={
                  receiptMethod === "BANK"
                    ? "Ex.: MUFG, Mizuho…"
                    : "Ex.: PayPay, Rakuten Pay…"
                }
                required
              />
            </label>
          )}
        </>
      ) : (
        /* ===== GASTOS ===== */
        <>
          <label>
            Categoria
            {showSelect ? (
              <select value={extra} onChange={(e) => setExtra(e.target.value)}>
                <option value="" disabled>
                  Selecione...
                </option>
                {options.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="text"
                  required
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Ex.: Alimentação, Transporte…"
                />
                <small style={{ color: "#6b7280" }}>
                  Dica: cadastre categorias na página <b>Gastos</b> para virar
                  uma lista.
                </small>
              </>
            )}
          </label>

          <label>
            Forma de pagamento
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PayMethod)}
            >
              <option value="CASH">Dinheiro</option>
              <option value="CREDIT_CARD">Cartão</option>
              <option value="APP">App</option>
            </select>
          </label>

          {payMethod === "APP" && (
            <label>
              App (ex.: PayPay, Line Pay…)
              <input
                type="text"
                value={payApp}
                onChange={(e) => setPayApp(e.target.value)}
                placeholder="Nome do app"
              />
            </label>
          )}
        </>
      )}

      <label>
        Observação
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
        />
      </label>

      <button className="btn icon-add" type="submit" title="Adicionar">
        +
      </button>
    </form>
  );
}
