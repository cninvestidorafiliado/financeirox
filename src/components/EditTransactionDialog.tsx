"use client";
import { useState, useEffect } from "react";
import { listTransactions, saveTransactions, emitChange } from "@/lib/storage";
import { Income, Expense } from "@/lib/finance";

export default function EditTransactionDialog({
  open,
  onClose,
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  item: Income | Expense | null;
  onSaved: (prev: any, next: any) => void;
}) {
  const [form, setForm] = useState(item);

  useEffect(() => setForm(item), [item]);
  if (!open || !form) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const all = listTransactions();
    const idx = all.findIndex((t) => t.id === form.id);
    const prev = all[idx];
    all[idx] = form;
    saveTransactions(all);
    emitChange();
    onSaved(prev, form);
    onClose();
  };

  return (
    <div className="modal">
      <form className="card" onSubmit={onSubmit}>
        <h3>Editar {form.type === "INCOME" ? "Ganho" : "Gasto"}</h3>

        <label>
          Valor:
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: Number(e.target.value) })
            }
          />
        </label>

        {form.type === "INCOME" ? (
          <label>
            Origem:
            <input
              value={(form as Income).incomeSource}
              onChange={(e) =>
                setForm({ ...form, incomeSource: e.target.value } as Income)
              }
            />
          </label>
        ) : (
          <label>
            Categoria:
            <input
              value={(form as Expense).expenseCategory}
              onChange={(e) =>
                setForm({ ...form, expenseCategory: e.target.value } as Expense)
              }
            />
          </label>
        )}

        <label>
          Observação:
          <input
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="submit" className="btn">
            Salvar
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
