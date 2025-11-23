"use client";

import { useEffect, useState } from "react";
import { formatJPYStable } from "@/lib/finance";

type TxType = "INCOME" | "EXPENSE";

type Tx = {
  id: string;
  type: TxType;
  amount: number;
  occurredAt: string;
};

type TaxSummary = {
  totalIncome: number;
  totalExpense: number;
  taxableBase: number;
  taxAmount: number;
  bracketRate: number;
  effectiveRate: number;
  bracketLabel: string;
};

const TAX_BRACKETS = [
  {
    min: 0,
    max: 1_950_000,
    rate: 0.05,
    deduction: 0,
    label: "Até ¥1.95M — 5%",
  },
  {
    min: 1_950_000,
    max: 3_300_000,
    rate: 0.1,
    deduction: 97_500,
    label: "¥1.95M a ¥3.3M — 10% - ¥97,500",
  },
  {
    min: 3_300_000,
    max: 6_950_000,
    rate: 0.2,
    deduction: 427_500,
    label: "¥3.3M a ¥6.95M — 20% - ¥427,500",
  },
  {
    min: 6_950_000,
    max: 9_000_000,
    rate: 0.23,
    deduction: 636_000,
    label: "¥6.95M a ¥9M — 23% - ¥636,000",
  },
  {
    min: 9_000_000,
    max: 18_000_000,
    rate: 0.33,
    deduction: 1_536_000,
    label: "¥9M a ¥18M — 33% - ¥1,536,000",
  },
  {
    min: 18_000_000,
    max: 40_000_000,
    rate: 0.4,
    deduction: 2_796_000,
    label: "¥18M a ¥40M — 40% - ¥2,796,000",
  },
  {
    min: 40_000_000,
    max: null,
    rate: 0.45,
    deduction: 4_796_000,
    label: "Acima de ¥40M — 45% - ¥4,796,000",
  },
];

function findBracket(base: number) {
  if (base <= 0) {
    return TAX_BRACKETS[0];
  }
  for (const b of TAX_BRACKETS) {
    if (base >= b.min && (b.max === null || base < b.max)) {
      return b;
    }
  }
  return TAX_BRACKETS[TAX_BRACKETS.length - 1];
}

export default function TaxSummaryCard() {
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const year = now.getFullYear();
        const from = `${year}-01-01`;
        const to = now.toISOString().slice(0, 10);

        const params = new URLSearchParams();
        params.set("from", from);
        params.set("to", to);

        const res = await fetch(`/api/transactions?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          console.error(
            "Erro ao carregar transações para imposto:",
            await res.text()
          );
          setError("Erro ao carregar dados.");
          setSummary(null);
          return;
        }

        const data = (await res.json()) as Tx[];

        let totalIncome = 0;
        let totalExpense = 0;

        for (const tx of data) {
          const value = Number(tx.amount || 0);
          if (!Number.isFinite(value) || value <= 0) continue;

          if (tx.type === "INCOME") {
            totalIncome += value;
          } else if (tx.type === "EXPENSE") {
            totalExpense += value;
          }
        }

        const taxableBase = Math.max(totalIncome - totalExpense, 0);
        const bracket = findBracket(taxableBase);

        let taxAmount = taxableBase * bracket.rate - bracket.deduction;
        if (taxAmount < 0) taxAmount = 0;

        const effectiveRate = taxableBase > 0 ? taxAmount / taxableBase : 0;

        setSummary({
          totalIncome,
          totalExpense,
          taxableBase,
          taxAmount,
          bracketRate: bracket.rate,
          effectiveRate,
          bracketLabel: bracket.label,
        });
      } catch (err) {
        console.error("Erro ao calcular imposto:", err);
        setError("Erro ao carregar dados.");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    load();

    const handler = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("finx:transactions-changed", handler);
      window.addEventListener("storage", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("finx:transactions-changed", handler);
        window.removeEventListener("storage", handler);
      }
    };
  }, []);

  return (
    <section className="tax-root">
      <style jsx>{`
        .tax-root {
          margin-top: 24px;
          background: #fff7ed; /* Laranja claro */
          border-radius: 24px;
          padding: 18px 18px 16px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
          border: 1px solid #fed7aa; /* Laranja suave */
        }
        .tax-title {
          font-size: 18px;
          font-weight: 800;
          color: #c2410c; /* Laranja queimado bonito */
          margin-bottom: 12px;
          text-align: center; /* CENTRALIZADO */
        }
        .tax-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .tax-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 12px 14px;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        }
        .tax-card-title {
          font-size: 14px;
          font-weight: 700;
          color: #7c2d12; /* tom laranja */
          margin-bottom: 4px;
        }
        .tax-main-value {
          font-size: 20px;
          font-weight: 800;
          color: #b91c1c;
          margin-bottom: 6px;
        }
        .tax-sub {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
        }
        .tax-rate-value {
          font-size: 22px;
          font-weight: 800;
          color: #c2410c; /* laranja forte */
          margin-bottom: 4px;
        }
        .tax-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 999px;
          background: #ffedd5; /* badge laranja suave */
          font-size: 11px;
          color: #9a3412;
          font-weight: 600;
          margin-bottom: 4px;
        }
        @media (max-width: 640px) {
          .tax-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h3 className="tax-title">Imposto de renda estimado (Ano Atual)</h3>

      <div className="tax-grid">
        <div className="tax-card">
          <div className="tax-card-title">Imposto estimado até hoje</div>
          {summary ? (
            <>
              <div className="tax-main-value">
                {formatJPYStable(summary.taxAmount)}
              </div>
              <div className="tax-sub">
                Base de cálculo atual:{" "}
                <strong>{formatJPYStable(summary.taxableBase)}</strong>
                <br />
                Receitas: {formatJPYStable(summary.totalIncome)} · Despesas:{" "}
                {formatJPYStable(summary.totalExpense)}
              </div>
            </>
          ) : loading ? (
            <div className="tax-loading">Calculando imposto...</div>
          ) : (
            <div className="tax-sub">Sem dados suficientes ainda.</div>
          )}
        </div>

        <div className="tax-card">
          <div className="tax-card-title">Faixa de imposto atual</div>
          {summary ? (
            <>
              <div className="tax-rate-value">
                {(summary.bracketRate * 100).toFixed(1)}%
              </div>
              <div className="tax-badge">
                Efetivo: {(summary.effectiveRate * 100).toFixed(2)}%
              </div>
              <div className="tax-sub">{summary.bracketLabel}</div>
            </>
          ) : loading ? (
            <div className="tax-loading">Verificando faixa...</div>
          ) : (
            <div className="tax-sub">
              Adicione receitas e despesas para ver sua faixa atual.
            </div>
          )}
        </div>
      </div>

      {error && <div className="tax-error">{error}</div>}
    </section>
  );
}
