"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonthRange, listByTypeInMonth } from "@/lib/storage";
import { formatJPYStable } from "@/lib/finance";

type Row = {
  id: string;
  date: string; // ISO
  leftTitle: string; // Categoria (gasto) / Origem (ganho)
  method: string; // Forma de pagamento / Forma de recebimento
  detail?: string; // Conta/App (ganho) ou App (gasto)
  note: string;
  value: number;
};

function parseISODateNoTZ(s: string): Date {
  if (!s) return new Date(NaN);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
  const d = new Date(s);
  if (isNaN(d.getTime()) && /^\d{4}[-/]\d{2}[-/]\d{2}/.test(s)) {
    const clean = s.replace(/\//g, "-").slice(0, 10);
    const [y, m, day] = clean.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, day ?? 1);
  }
  return d;
}

function fmtDateBR(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function monthLabelSafe(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(d);
}

function safeLabel(x: any): string | undefined {
  if (!x) return undefined;
  if (typeof x === "string") return x;
  if (typeof x?.name === "string") return x.name;
  if (typeof x?.label === "string") return x.label;
  if (typeof x?.title === "string") return x.title;
  if (typeof x?.titulo === "string") return x.titulo;
  if (typeof x?.nome === "string") return x.nome;
  return undefined;
}

function normalizeExpense(t: any): Row {
  const date: string =
    t?.occurredAt ||
    t?.occurred_at ||
    t?.date ||
    t?.when ||
    t?.createdAt ||
    t?.data ||
    "";
  const value = Number(t?.amount ?? t?.value ?? t?.valor ?? 0);

  const leftTitle =
    safeLabel(t?.category) ||
    safeLabel(t?.expenseCategory) ||
    safeLabel(t?.expense_category) ||
    safeLabel(t?.categoria) ||
    "—";

  const methodRaw =
    safeLabel(t?.paymentMethod) ||
    safeLabel(t?.payMethod) ||
    safeLabel(t?.payment_method) ||
    safeLabel(t?.method) ||
    safeLabel(t?.formaDePagamento) ||
    safeLabel(t?.forma) ||
    "";

  const method = methodRaw || "—";

  const detail =
    t?.paymentDetail ||
    t?.payApp ||
    t?.payment_detail ||
    t?.app ||
    t?.detail ||
    undefined;

  const note =
    t?.note ??
    t?.notes ??
    t?.obs ??
    t?.observacao ??
    t?.observações ??
    t?.meta?.note ??
    "";

  return {
    id: String(t?.id ?? `${date}-${leftTitle}-${value}-EXPENSE`),
    date,
    leftTitle,
    method,
    detail,
    note,
    value,
  };
}

function normalizeIncome(t: any): Row {
  const date: string =
    t?.occurredAt ||
    t?.occurred_at ||
    t?.date ||
    t?.when ||
    t?.createdAt ||
    t?.data ||
    "";
  const value = Number(t?.amount ?? t?.value ?? t?.valor ?? 0);

  const leftTitle =
    safeLabel(t?.origin) ||
    safeLabel(t?.incomeSource) ||
    safeLabel(t?.income_source) ||
    safeLabel(t?.source) ||
    safeLabel(t?.origem) ||
    "—";

  const methodRaw =
    safeLabel(t?.receiptMethod) ||
    safeLabel(t?.receipt_method) ||
    safeLabel(t?.incomeMethod) ||
    safeLabel(t?.formaDeRecebimento) ||
    safeLabel(t?.method) ||
    "";

  const method = methodRaw || "—";

  const detail =
    t?.receiptDetail || t?.receipt_detail || t?.conta || t?.app || undefined;

  const note =
    t?.note ??
    t?.notes ??
    t?.obs ??
    t?.observacao ??
    t?.observações ??
    t?.meta?.note ??
    "";

  return {
    id: String(t?.id ?? `${date}-${leftTitle}-${value}-INCOME`),
    date,
    leftTitle,
    method,
    detail,
    note,
    value,
  };
}

function TxRowExpense({ row }: { row: Row }) {
  const d = parseISODateNoTZ(row.date);
  const dateStr = isNaN(d.getTime()) ? "—" : fmtDateBR(d);

  return (
    <div className="tx-row-expense">
      <div className="tx-date">{dateStr}</div>
      <div className="tx-title">{row.leftTitle || "—"}</div>
      <div className="tx-method">{row.method || "—"}</div>
      <div className={`tx-note ${row.note ? "" : "tx-note-empty"}`}>
        {row.note || "—"}
      </div>
      <div className="tx-value expense">{formatJPYStable(row.value)}</div>

      <style jsx>{`
        .tx-row-expense {
          display: grid;
          grid-template-columns: 90px 1fr 180px minmax(80px, 1fr) 110px;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
        }
        .tx-row-expense + .tx-row-expense {
          margin-top: 6px;
        }
        .tx-date {
          color: #475569;
          font-weight: 600;
        }
        .tx-title {
          color: #0f172a;
          font-weight: 700;
        }
        .tx-method {
          color: #334155;
        }
        .tx-note {
          color: #6b7280;
        }
        .tx-note-empty {
          color: #cbd5e1;
          font-style: italic;
        }
        .tx-value {
          text-align: right;
          font-weight: 800;
          color: #ef4444;
        }
        @media (max-width: 900px) {
          .tx-row-expense {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .tx-value {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

function TxRowIncome({ row }: { row: Row }) {
  const d = parseISODateNoTZ(row.date);
  const dateStr = isNaN(d.getTime()) ? "—" : fmtDateBR(d);

  return (
    <div className="tx-row-income">
      <div className="tx-date">{dateStr}</div>
      <div className="tx-title">{row.leftTitle || "—"}</div>
      <div className="tx-method">{row.method || "—"}</div>
      <div className="tx-detail">{row.detail || "—"}</div>
      <div className={`tx-note ${row.note ? "" : "tx-note-empty"}`}>
        {row.note || "—"}
      </div>
      <div className="tx-value income">{formatJPYStable(row.value)}</div>

      <style jsx>{`
        .tx-row-income {
          display: grid;
          grid-template-columns: 90px 1fr 180px 180px minmax(80px, 1fr) 110px;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
        }
        .tx-row-income + .tx-row-income {
          margin-top: 6px;
        }
        .tx-date {
          color: #475569;
          font-weight: 600;
        }
        .tx-title {
          color: #0f172a;
          font-weight: 700;
        }
        .tx-method,
        .tx-detail {
          color: #334155;
        }
        .tx-note {
          color: #6b7280;
        }
        .tx-note-empty {
          color: #cbd5e1;
          font-style: italic;
        }
        .tx-value {
          text-align: right;
          font-weight: 800;
          color: #16a34a;
        }
        @media (max-width: 1050px) {
          .tx-row-income {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .tx-value {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

function SectionExpense({ rows, total }: { rows: Row[]; total: number }) {
  return (
    <section className="card">
      <header className="card-head">
        <h3>Despesas</h3>
        <span className="badge" suppressHydrationWarning>
          {formatJPYStable(total)}
        </span>
      </header>

      <div className="header-grid-expense">
        <div>Dia</div>
        <div>Categoria</div>
        <div>Forma de Pagamento</div>
        <div>Observações</div>
        <div style={{ textAlign: "right" }}>Valor</div>
      </div>

      <div className="card-body">
        {rows.length === 0 ? (
          <div className="empty">Sem registros.</div>
        ) : (
          rows
            .slice()
            .sort(
              (a, b) =>
                parseISODateNoTZ(a.date).getTime() -
                parseISODateNoTZ(b.date).getTime()
            )
            .map((row) => <TxRowExpense key={row.id} row={row} />)
        )}
      </div>

      <style jsx>{`
        .card {
          background: #f8fafc;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 14px;
        }
        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
        }
        h3 {
          margin: 0;
          font: 800 18px/1.2 Inter, system-ui, sans-serif;
          color: #0f172a;
        }
        .badge {
          padding: 6px 10px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          font-weight: 700;
          font-size: 12px;
        }
        .header-grid-expense {
          display: grid;
          grid-template-columns: 90px 1fr 180px minmax(80px, 1fr) 110px;
          gap: 10px;
          padding: 6px 10px 8px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
        }
        .card-body {
          display: grid;
          gap: 6px;
        }
        .empty {
          padding: 10px;
          color: #94a3b8;
          font-weight: 600;
        }
        @media (max-width: 900px) {
          .header-grid-expense {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}

function SectionIncome({ rows, total }: { rows: Row[]; total: number }) {
  return (
    <section className="card">
      <header className="card-head">
        <h3>Ganhos</h3>
        <span className="badge" suppressHydrationWarning>
          {formatJPYStable(total)}
        </span>
      </header>

      <div className="header-grid-income">
        <div>Dia</div>
        <div>Origem</div>
        <div>Forma de Recebimento</div>
        <div>Conta/App</div>
        <div>Observações</div>
        <div style={{ textAlign: "right" }}>Valor</div>
      </div>

      <div className="card-body">
        {rows.length === 0 ? (
          <div className="empty">Sem registros.</div>
        ) : (
          rows
            .slice()
            .sort(
              (a, b) =>
                parseISODateNoTZ(a.date).getTime() -
                parseISODateNoTZ(b.date).getTime()
            )
            .map((row) => <TxRowIncome key={row.id} row={row} />)
        )}
      </div>

      <style jsx>{`
        .card {
          background: #f8fafc;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 14px;
        }
        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
        }
        h3 {
          margin: 0;
          font: 800 18px/1.2 Inter, system-ui, sans-serif;
          color: #0f172a;
        }
        .badge {
          padding: 6px 10px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          font-weight: 700;
          font-size: 12px;
        }
        .header-grid-income {
          display: grid;
          grid-template-columns: 90px 1fr 180px 180px minmax(80px, 1fr) 110px;
          gap: 10px;
          padding: 6px 10px 8px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
        }
        .card-body {
          display: grid;
          gap: 6px;
        }
        .empty {
          padding: 10px;
          color: #94a3b8;
          font-weight: 600;
        }
        @media (max-width: 1050px) {
          .header-grid-income {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}

export default function TransacoesPage() {
  const today = new Date();
  const [anchor, setAnchor] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const month = useMemo(() => getMonthRange(anchor), [anchor]);

  const [expenseRows, setExpenseRows] = useState<Row[]>([]);
  const [incomeRows, setIncomeRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!mounted) return;

    const expLocal = listByTypeInMonth("EXPENSE", month);
    const incLocal = listByTypeInMonth("INCOME", month);

    setExpenseRows(expLocal.map(normalizeExpense));
    setIncomeRows(incLocal.map(normalizeIncome));
  }, [mounted, month]);

  const totalExpense = expenseRows.reduce((s, r) => s + (r.value || 0), 0);
  const totalIncome = incomeRows.reduce((s, r) => s + (r.value || 0), 0);

  const canGoNext =
    anchor.getFullYear() < today.getFullYear() ||
    (anchor.getFullYear() === today.getFullYear() &&
      anchor.getMonth() < today.getMonth());

  return (
    <div className="wrap">
      <h1>Transações do Mês</h1>

      <div className="month-nav">
        <button
          className="arrow"
          onClick={() =>
            setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))
          }
          aria-label="Mês anterior"
        >
          ◀
        </button>

        <div className="label" suppressHydrationWarning>
          {monthLabelSafe(anchor)}
        </div>

        <button
          className="arrow"
          onClick={() =>
            canGoNext &&
            setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))
          }
          disabled={!canGoNext}
          aria-label="Próximo mês"
        >
          ▶
        </button>
      </div>

      <div className="grid">
        <SectionExpense rows={expenseRows} total={totalExpense} />
        <SectionIncome rows={incomeRows} total={totalIncome} />
      </div>

      <style jsx>{`
        .wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 18px 14px 100px;
        }
        h1 {
          text-align: center;
          font: 900 26px/1.2 Inter, system-ui, sans-serif;
          color: #0f172a;
          margin: 6px 0 14px;
        }
        .month-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        .label {
          padding: 8px 12px;
          background: #ffffff;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          font-weight: 800;
          text-transform: capitalize;
        }
        .arrow {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .arrow:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}
