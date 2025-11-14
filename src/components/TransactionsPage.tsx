"use client";
import { useEffect, useMemo, useState } from "react";
import {
  getMonthRange,
  listByTypeInMonth,
  deleteTransaction,
  emitChange,
} from "@/lib/storage";
import { formatJPYStable, Income, Expense } from "@/lib/finance";
import { isoYearMonth } from "@/lib/date";
import AddTransactionForm from "@/components/AddTransactionForm";
import EditTransactionDialog from "@/components/EditTransactionDialog";

type TransactionType = "INCOME" | "EXPENSE";

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
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function TransactionsPage({ type }: { type: TransactionType }) {
  const [items, setItems] = useState<(Income | Expense)[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Income | Expense | null>(null);

  const range = useMemo(() => getMonthRange(currentDate), [currentDate]);
  const reload = () =>
    setItems(listByTypeInMonth(type, range) as (Income | Expense)[]);
  useEffect(() => reload(), [range.start, range.end]);

  const total = items.reduce((s, t) => s + Number(t.amount), 0);
  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  const onDelete = (id: string) => {
    if (confirm("Excluir este registro?")) {
      deleteTransaction(id);
      emitChange();
      reload();
    }
  };

  const openEdit = (row: Income | Expense) => {
    setCurrentItem(row);
    setEditOpen(true);
  };

  const onSavedEdit = (prev: Income | Expense, next: Income | Expense) => {
    const p = isoYearMonth(prev.occurredAt);
    const n = isoYearMonth(next.occurredAt);
    if (p && n && (p.y !== n.y || p.m !== n.m))
      setCurrentDate(new Date(n.y, n.m - 1, 1));
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
          <div className="month-nav">
            <button className="icon-btn" onClick={prevMonth}>
              ◀
            </button>
            <div className="pill">
              <span>{monthLabel}</span>
            </div>
            <button className="icon-btn" onClick={nextMonth}>
              ▶
            </button>
          </div>
        </header>

        <section className="tp-grid">
          <div className="card tp-card">
            <h3 className="tp-card-title">Lista</h3>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  {type === "INCOME" ? (
                    <tr>
                      <th>Data</th>
                      <th>Origem</th>
                      <th>Valor</th>
                      <th>Obs.</th>
                      <th>Ações</th>
                    </tr>
                  ) : (
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
                      <td
                        colSpan={type === "INCOME" ? 5 : 7}
                        className="muted-center"
                      >
                        Sem registros.
                      </td>
                    </tr>
                  )}
                  {items.map((t) => (
                    <tr key={t.id}>
                      {type === "INCOME" ? (
                        <>
                          <td data-label="Data">{formatDMY(t.occurredAt)}</td>
                          <td data-label="Origem">
                            {(t as Income).incomeSource}
                          </td>
                          <td data-label="Valor">
                            {formatJPYStable(t.amount)}
                          </td>
                          <td data-label="Obs.">{t.notes ?? "-"}</td>
                          <td className="actions">
                            <button
                              className="icon-action edit"
                              onClick={() => openEdit(t)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className="icon-action delete"
                              onClick={() => onDelete(t.id)}
                              title="Excluir"
                            >
                              ❌
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td data-label="Data">{formatDMY(t.occurredAt)}</td>
                          <td data-label="Categoria">
                            {(t as Expense).expenseCategory}
                          </td>
                          <td data-label="Forma">
                            {(t as Expense).payMethod === "CASH"
                              ? "Dinheiro"
                              : (t as Expense).payMethod === "CREDIT_CARD"
                              ? "Cartão"
                              : "App"}
                          </td>
                          <td data-label="App">
                            {(t as Expense).payApp ?? "-"}
                          </td>
                          <td data-label="Valor">
                            {formatJPYStable(t.amount)}
                          </td>
                          <td data-label="Obs.">{t.notes ?? "-"}</td>
                          <td className="actions">
                            <button
                              className="icon-action edit"
                              onClick={() => openEdit(t)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className="icon-action delete"
                              onClick={() => onDelete(t.id)}
                              title="Excluir"
                            >
                              ❌
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={type === "INCOME" ? 2 : 4}></td>
                    <td className="tfoot-sum">{formatJPYStable(total)}</td>
                    <td colSpan={type === "INCOME" ? 2 : 2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="card tp-card">
            <h3 className="tp-card-title">
              <span className="title-icon" aria-hidden="true">
                {type === "INCOME" ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M12 3l4.5 4.5-1.4 1.4L13 6.8V20h-2V6.8L8.9 8.9 7.5 7.5 12 3z" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M12 21l-4.5-4.5 1.4-1.4L11 17.2V4h2v13.2l2.1-2.1 1.4 1.4L12 21z" />
                  </svg>
                )}
              </span>
              Adicionar {type === "INCOME" ? "Ganho" : "Gasto"}
            </h3>

            <div className="form-wrap">
              {/* onSaved agora recebe o tx lançado; se for de outro mês, mudamos a visão para esse mês */}
              <AddTransactionForm
                type={type}
                onSaved={(tx) => {
                  const d = new Date(tx.occurredAt);
                  const curYM = `${currentDate.getFullYear()}-${
                    currentDate.getMonth() + 1
                  }`;
                  const txYM = `${d.getFullYear()}-${d.getMonth() + 1}`;
                  if (curYM !== txYM) {
                    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                  }
                  // em ambos os casos, recarrega a lista
                  reload();
                }}
              />
            </div>
          </div>
        </section>
      </div>

      <EditTransactionDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        item={currentItem}
        onSaved={onSavedEdit}
      />
    </main>
  );
}
