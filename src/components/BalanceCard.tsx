"use client";

import { useMemo } from "react";

type Transaction = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  incomeSource?: string | null;
  occurredAt: string;
};

type SourceConfig = {
  name: string;
  workWeekStart: number;
  paymentWeekday: number;
};

type SourceBalance = {
  source: string;
  current: number;
  future: number;
};

type BalanceCardProps = {
  monthLabel: string;
  transactions: Transaction[];
  sourceConfigs: SourceConfig[];
  format: (value: number, opts?: any) => string;
  hideBalance: boolean;
  onToggleHide: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  nextDisabled: boolean;
};

export default function BalanceCard({
  monthLabel,
  transactions,
  sourceConfigs,
  format,
  hideBalance,
  onToggleHide,
  onPrevMonth,
  onNextMonth,
  nextDisabled,
}: BalanceCardProps) {
  const { totalPaid, balances } = useMemo(() => {
    const sourceMap = new Map(sourceConfigs.map((s) => [s.name, s]));
    const acc = new Map<string, SourceBalance>();
    let totalPaid = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const tx of transactions.filter((t) => t.type === "INCOME")) {
      const sourceName = tx.incomeSource ?? "Outros";
      const cfg = sourceMap.get(sourceName);
      if (!cfg) continue;

      if (!acc.has(sourceName)) {
        acc.set(sourceName, { source: sourceName, current: 0, future: 0 });
      }

      const txDate = new Date(tx.occurredAt);
      txDate.setHours(0, 0, 0, 0);

      const paymentDate = new Date(txDate);
      let diff = (cfg.paymentWeekday - paymentDate.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      paymentDate.setDate(paymentDate.getDate() + diff);

      const bucket = paymentDate <= today ? "current" : "future";
      acc.get(sourceName)![bucket] += tx.amount;

      if (bucket === "current") totalPaid += tx.amount;
    }

    return {
      totalPaid,
      balances: Array.from(acc.values()),
    };
  }, [transactions, sourceConfigs]);

  return (
    <article className="card hero-balance spring-card">
      {/* TOPO */}
      <div className="hero-toolbar">
        <button className="icon-btn" onClick={onPrevMonth}>
          ◀
        </button>
        <div className="pill month-label">{monthLabel}</div>
        <button
          className="icon-btn"
          onClick={onNextMonth}
          disabled={nextDisabled}
        >
          ▶
        </button>
        <button className="hero-eye" onClick={onToggleHide}>
          👁️
        </button>
      </div>

      {/* TOTAL */}
      <div className="hero-balance-row">
        <div className="hero-balance-value pos">
          {hideBalance ? "•••••" : format(totalPaid)}
        </div>
        <small>Saldo total de receitas no mês</small>
      </div>

      {/* LISTA COMO MINI-TABELA */}
      <div className="origin-list">
        {balances.map((src) => (
          <div key={src.source} className="origin-table">
            <div className="origin-header">
              <span>Origem</span>
              <span>Saldo Atual</span>
              <span>Saldo à Receber</span>
            </div>

            <div className="origin-values">
              <strong>{src.source}</strong>
              <span className="current">
                {hideBalance ? "•••" : format(src.current)}
              </span>
              <span className="future">
                {hideBalance ? "•••" : format(src.future)}
              </span>
            </div>
          </div>
        ))}

        {balances.length === 0 && (
          <p className="hero-mini-empty">Nenhuma receita cadastrada.</p>
        )}
      </div>

      <style jsx>{`
        .origin-list {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .origin-table {
          background: #f9f9f9;
          border-radius: 10px;
          padding: 10px 14px;
        }

        .origin-header,
        .origin-values {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          align-items: center;
        }

        .origin-header {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .origin-values {
          font-size: 0.95rem;
          font-weight: 600;
        }

        /* ===== HEADER ===== */
        .origin-header span:nth-child(1) {
          text-align: left;
        }

        .origin-header span:nth-child(2) {
          text-align: center;
        }

        .origin-header span:nth-child(3) {
          text-align: right;
        }

        /* ===== VALUES ===== */
        .origin-values strong {
          text-align: left;
          color: #111827;
        }

        .origin-values span:nth-child(2) {
          text-align: center;
        }

        .origin-values span:nth-child(3) {
          text-align: right;
        }

        /* primeira coluna (Origem) sempre à esquerda */
        .origin-header span:first-child,
        .origin-values strong {
          text-align: left;
        }

        .origin-values strong {
          text-align: left;
          color: #111827;
        }

        .current {
          color: #1d4ed8;
        }

        .future {
          color: #ea580c;
        }
      `}</style>
    </article>
  );
}
