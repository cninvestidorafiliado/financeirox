"use client";

import { useCallback, useEffect, useState } from "react";
import type { Income, Expense } from "@/types/finance";
import { emitChange } from "@/lib/storage";

type TxType = "INCOME" | "EXPENSE";

type PayMethod = "CASH" | "CREDIT_CARD" | "APP";

/** Forma de recebimento para ganhos */
type ReceiptMethod = "CASH" | "BANK" | "APP";

type NamedItem = {
  id: string;
  name: string;
};

type Props = {
  type: TxType;
  onSaved?: (tx: Income | Expense) => void;
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function AddTransactionForm({ type, onSaved }: Props) {
  // Campos comuns
  const [occurredAt, setOccurredAt] = useState<string>(todayISO());
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Campo “extra” (origem ou categoria)
  const [extra, setExtra] = useState<string>("");

  // Ganhos
  const [receiptMethod, setReceiptMethod] = useState<ReceiptMethod>("CASH");
  const [receiptDetail, setReceiptDetail] = useState<string>("");

  // Gastos
  const [payMethod, setPayMethod] = useState<PayMethod>("CASH");
  const [payApp, setPayApp] = useState<string>("");

  // Listas carregadas do backend
  const [incomeSources, setIncomeSources] = useState<NamedItem[] | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<
    NamedItem[] | null
  >(null);

  // ---- Carregar origens/categorias do backend -------------------------

  const loadSources = useCallback(async () => {
    try {
      const res = await fetch("/api/sources");
      if (!res.ok) {
        console.error(
          "Erro ao carregar origens/categorias. Status:",
          res.status
        );
        setIncomeSources([]);
        setExpenseCategories([]);
        return;
      }

      const data = await res.json();
      setIncomeSources(data.incomeSources ?? []);
      setExpenseCategories(data.expenseCategories ?? []);
    } catch (error) {
      console.error("Erro ao carregar origens/categorias:", error);
      setIncomeSources([]);
      setExpenseCategories([]);
    }
  }, []);

  // Carrega na montagem
  useEffect(() => {
    loadSources();
  }, [loadSources]);

  // Recarrega quando receber eventos globais
  useEffect(() => {
    const handler = () => {
      loadSources();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("finx:sources-changed", handler);
      window.addEventListener("finx:storage", handler);
      window.addEventListener("storage", handler);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("finx:sources-changed", handler);
        window.removeEventListener("finx:storage", handler);
        window.removeEventListener("storage", handler);
      }
    };
  }, [loadSources]);

  // ---------------------------------------------------------------------

  const resetForm = () => {
    setOccurredAt(todayISO());
    setAmount("");
    setNotes("");
    setExtra("");
    setReceiptMethod("CASH");
    setReceiptDetail("");
    setPayMethod("CASH");
    setPayApp("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numeric = Number(amount.replace(",", "."));

    if (!Number.isFinite(numeric) || numeric <= 0) {
      alert("Digite um valor válido maior que zero.");
      return;
    }

    if (!occurredAt) {
      alert("Escolha a data da transação.");
      return;
    }

    if (!extra.trim()) {
      alert(
        type === "INCOME"
          ? "Selecione ou informe a origem do ganho."
          : "Selecione ou informe a categoria do gasto."
      );
      return;
    }

    const payload: any = {
      type,
      occurredAt,
      amount: numeric,
      notes: notes.trim() || undefined,
    };

    if (type === "INCOME") {
      payload.incomeSource = extra.trim();
      payload.receiptMethod = receiptMethod;
      if (receiptMethod === "BANK" || receiptMethod === "APP") {
        payload.receiptDetail = receiptDetail.trim() || undefined;
      }
    } else {
      payload.expenseCategory = extra.trim();
      payload.payMethod = payMethod;
      if (payMethod === "APP") {
        payload.payApp = payApp.trim() || undefined;
      }
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(
          "Erro ao salvar transação. Status:",
          res.status,
          await res.text()
        );
        alert("Não foi possível salvar a transação.");
        return;
      }

      const saved = (await res.json()) as Income | Expense;

      // Notifica outras partes do app
      try {
        emitChange?.();
      } catch {
        /* ignore */
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("finx:transactions-changed"));
        window.dispatchEvent(new Event("finx:storage"));
      }

      onSaved?.(saved);
      resetForm();
    } catch (error) {
      console.error("Erro ao chamar /api/transactions:", error);
      alert("Erro de conexão ao salvar transação.");
    }
  };

  const options =
    type === "INCOME" ? incomeSources ?? [] : expenseCategories ?? [];

  const showReceiptDetail =
    type === "INCOME" && (receiptMethod === "BANK" || receiptMethod === "APP");

  const showPayApp = type === "EXPENSE" && payMethod === "APP";

  return (
    <>
      <form className="tx-form" onSubmit={handleSubmit}>
        <div className="tx-grid">
          <div className="tx-field">
            <label>Data</label>
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>

          <div className="tx-field">
            <label>Valor</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="tx-field">
            <label>
              {type === "INCOME" ? "Origem do ganho" : "Categoria do gasto"}
            </label>

            {options === null ? (
              <select disabled>
                <option>Carregando...</option>
              </select>
            ) : options.length === 0 ? (
              <select disabled>
                <option>Nenhuma cadastrada</option>
              </select>
            ) : (
              <select
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="tx-field tx-notes">
            <label>Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          {type === "INCOME" ? (
            <>
              <div className="tx-field">
                <label>Recebido via</label>
                <select
                  value={receiptMethod}
                  onChange={(e) =>
                    setReceiptMethod(e.target.value as ReceiptMethod)
                  }
                >
                  <option value="CASH">Dinheiro</option>
                  <option value="BANK">Conta bancária</option>
                  <option value="APP">App (PayPay, etc.)</option>
                </select>
              </div>

              {showReceiptDetail && (
                <div className="tx-field">
                  <label>
                    {receiptMethod === "BANK" ? "Banco / Conta" : "Nome do app"}
                  </label>
                  <input
                    type="text"
                    value={receiptDetail}
                    onChange={(e) => setReceiptDetail(e.target.value)}
                    placeholder={
                      receiptMethod === "BANK"
                        ? "Banco, agência, conta..."
                        : "PayPay, LinePay..."
                    }
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="tx-field">
                <label>Forma de pagamento</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PayMethod)}
                >
                  <option value="CASH">Dinheiro</option>
                  <option value="CREDIT_CARD">Cartão de crédito</option>
                  <option value="APP">App (PayPay, etc.)</option>
                </select>
              </div>

              {showPayApp && (
                <div className="tx-field">
                  <label>Nome do app</label>
                  <input
                    type="text"
                    value={payApp}
                    onChange={(e) => setPayApp(e.target.value)}
                    placeholder="PayPay, LinePay..."
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="tx-actions">
          <button type="submit" className="btn-primary">
            {type === "INCOME" ? "Adicionar ganho" : "Adicionar gasto"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .tx-form {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px 20px 22px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
        }

        .tx-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 18px;
        }

        @media (max-width: 768px) {
          .tx-grid {
            grid-template-columns: 1fr;
          }
        }

        .tx-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tx-field label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #0f172a;
        }

        .tx-field input,
        .tx-field select,
        .tx-field textarea {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          background: #f8fafc;
        }

        .tx-field input:focus,
        .tx-field select:focus,
        .tx-field textarea:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.16);
          background: #ffffff;
        }

        .tx-notes {
          grid-column: 1 / -1;
        }

        .tx-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
        }

        .btn-primary {
          min-width: 160px;
          border-radius: 999px;
          padding: 10px 20px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #ffffff;
          box-shadow: 0 10px 22px rgba(22, 163, 74, 0.28);
          transition: transform 0.12s ease, box-shadow 0.12s ease,
            filter 0.12s ease;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(22, 163, 74, 0.32);
          filter: brightness(1.03);
        }

        .btn-primary:active {
          transform: translateY(0);
          box-shadow: 0 8px 18px rgba(22, 163, 74, 0.25);
          filter: brightness(0.98);
        }
      `}</style>
    </>
  );
}
