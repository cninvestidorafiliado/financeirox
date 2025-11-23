"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonthRange } from "@/lib/storage";
import { formatJPYStable, Income, Expense } from "@/lib/finance";
import AddTransactionForm from "@/components/AddTransactionForm";
import EditTransactionDialog from "@/components/EditTransactionDialog";

type TransactionType = "INCOME" | "EXPENSE";

/**
 * Linha de transação vinda da API.
 * Estendemos Income/Expense com campos opcionais que existem no backend
 * (schema Prisma: occurredAt, notes, incomeSource, expenseCategory, etc.).
 */
type TxRow = (Income | Expense) & {
  id: string;
  occurredAt: string;
  amount: number;
  notes?: string | null;
  incomeSource?: string | null;
  expenseCategory?: string | null;
  receiptMethod?: string | null;
  receiptDetail?: string | null;
  payMethod?: string | null;
  payApp?: string | null;
};

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function formatDMY(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function TransactionsPage({ type }: { type: TransactionType }) {
  const [items, setItems] = useState<TxRow[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<TxRow | null>(null);

  const range = useMemo(() => getMonthRange(currentDate), [currentDate]);

  const reload = async () => {
    try {
      const params = new URLSearchParams();
      params.set("type", type);
      const from = range.start.toISOString().slice(0, 10);
      const to = range.end.toISOString().slice(0, 10);
      params.set("from", from);
      params.set("to", to);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) {
        console.error("Erro ao carregar transações:", await res.text());
        return;
      }
      const data = (await res.json()) as TxRow[];
      setItems(data);
    } catch (err) {
      console.error("Erro ao chamar /api/transactions:", err);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, range.start, range.end]);

  const total = items.reduce((s, t) => s + Number(t.amount || 0), 0);

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );

  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  const onDelete = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;

    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        console.error("Erro ao excluir transação:", await res.text());
        alert("Erro ao excluir transação. Tente novamente.");
        return;
      }

      reload();
    } catch (err) {
      console.error("Erro ao chamar DELETE /api/transactions:", err);
      alert("Erro de conexão ao excluir transação.");
    }
  };

  const openEdit = (row: TxRow) => {
    setCurrentItem(row);
    setEditOpen(true);
  };

  const onSavedEdit = (prev: any, next: any) => {
    // prev/next vêm do EditTransactionDialog
    setEditOpen(false);
    setCurrentItem(null);

    try {
      const nextDate = new Date(next.occurredAt);
      if (!Number.isNaN(nextDate.getTime())) {
        const curKey = `${currentDate.getFullYear()}-${
          currentDate.getMonth() + 1
        }`;
        const nextKey = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}`;

        if (nextKey !== curKey) {
          setCurrentDate(
            new Date(nextDate.getFullYear(), nextDate.getMonth(), 1)
          );
        }
      }
    } catch {
      // se der erro em data, só ignora e atualiza a lista
    }

    reload();
  };

  const monthLabel = `${
    MESES[currentDate.getMonth()]
  } ${currentDate.getFullYear()}`;

  return (
    <main className="app-main">
      <div className="card page-frame">
        <header className="page-head">
          <h2 className="page-title">
            {type === "INCOME" ? "Ganhos do Mês" : "Gastos do Mês"}
          </h2>

          <div className="page-subtitle-row">
            <button type="button" className="link-btn" onClick={prevMonth}>
              ◀
            </button>
            <span className="page-subtitle">{monthLabel}</span>
            <button type="button" className="link-btn" onClick={nextMonth}>
              ▶
            </button>
          </div>

          <div className="page-total">
            Total do período:{" "}
            <strong className={type === "INCOME" ? "txt-green" : "txt-red"}>
              {formatJPYStable(total)}
            </strong>
          </div>
        </header>

        <section className="page-section">
          <AddTransactionForm
            type={type}
            onSaved={(tx: any) => {
              try {
                const d = new Date(tx.occurredAt);
                if (!Number.isNaN(d.getTime())) {
                  const curKey = `${currentDate.getFullYear()}-${
                    currentDate.getMonth() + 1
                  }`;
                  const txKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
                  if (curKey !== txKey) {
                    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                  }
                }
              } catch {
                // ignora problema de data, mas recarrega
              }
              reload();
            }}
          />
        </section>

        <section className="page-section">
          <div className="table-wrapper">
            <table className="tx-table">
              <thead>
                {items.length > 0 && (
                  <tr>
                    <th>Data</th>
                    <th>Categoria</th>
                    <th>Forma</th>
                    <th>App</th>
                    <th>Valor</th>
                    <th>Obs.</th>
                    <th>Ações</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center" }}>
                      Nenhum registro neste mês.
                    </td>
                  </tr>
                )}
                {items.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDMY(t.occurredAt)}</td>
                    <td>
                      {t.type === "INCOME"
                        ? t.incomeSource ?? ""
                        : t.expenseCategory ?? ""}
                    </td>
                    <td>
                      {t.type === "INCOME"
                        ? t.receiptMethod ?? ""
                        : t.payMethod ?? ""}
                    </td>
                    <td>
                      {t.type === "INCOME"
                        ? t.receiptDetail ?? ""
                        : t.payApp ?? ""}
                    </td>
                    <td className="tx-amount">
                      {formatJPYStable(Number(t.amount || 0))}
                    </td>
                    <td className="tx-notes-cell">{t.notes ?? ""}</td>
                    <td className="tx-actions-cell">
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => openEdit(t)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="link-btn txt-red"
                        onClick={() => onDelete(t.id)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editOpen && (
        <EditTransactionDialog
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            setCurrentItem(null);
          }}
          item={currentItem}
          onSaved={onSavedEdit}
        />
      )}
    </main>
  );
}
