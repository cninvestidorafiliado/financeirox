"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatJPYStable } from "@/lib/finance";
import type { Income, Expense } from "@/types/finance";

type TxRow = (Income | Expense) & {
  id: string;
  occurredAt: string;
  amount: number;
};

type TxType = "INCOME" | "EXPENSE";
type Mode = "day" | "week" | "month" | "year";

type Bucket = {
  start: Date;
  end: Date;
  label: string;
  key: string;
};

const PT_WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const PT_MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const MAX_BAR_HEIGHT = 80; // barras bem menores
const MIN_BAR_HEIGHT = 6; // mínima pra não sumir

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=dom..6=sáb
  const diff = (day + 6) % 7; // semana começando na segunda
  x.setDate(x.getDate() - diff);
  return x;
}

function addWeeks(d: Date, n: number) {
  return addDays(d, n * 7);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

function addYears(d: Date, n: number) {
  return new Date(d.getFullYear() + n, 0, 1);
}

// buckets SEMPRE terminando no período atual de referência
function bucketsFor(mode: Mode, ref: Date): Bucket[] {
  const buckets: Bucket[] = [];

  if (mode === "day") {
    const end = startOfDay(ref);
    for (let i = 3; i >= 0; i--) {
      const s = addDays(end, -i);
      const e = addDays(s, 1);
      const label = PT_WEEKDAYS[s.getDay()];
      buckets.push({
        start: s,
        end: e,
        label,
        key: `d-${s.toISOString().slice(0, 10)}`,
      });
    }
    return buckets;
  }

  if (mode === "week") {
    const endWeek = startOfWeekMonday(ref);
    for (let i = 3; i >= 0; i--) {
      const s = addWeeks(endWeek, -i);
      const e = addWeeks(s, 1);
      const label = `${s.getDate()}/${(s.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      buckets.push({
        start: s,
        end: e,
        label,
        key: `w-${s.toISOString().slice(0, 10)}`,
      });
    }
    return buckets;
  }

  if (mode === "month") {
    const endMonth = startOfMonth(ref);
    for (let i = 3; i >= 0; i--) {
      const s = addMonths(endMonth, -i);
      const e = addMonths(s, 1);
      const label = `${PT_MONTHS_SHORT[s.getMonth()]}/${String(
        s.getFullYear() % 100
      ).padStart(2, "0")}`;
      buckets.push({
        start: s,
        end: e,
        label,
        key: `m-${s.getFullYear()}-${s.getMonth()}`,
      });
    }
    return buckets;
  }

  // year
  const endYear = startOfYear(ref);
  for (let i = 3; i >= 0; i--) {
    const s = addYears(endYear, -i);
    const e = addYears(s, 1);
    const label = String(s.getFullYear());
    buckets.push({
      start: s,
      end: e,
      label,
      key: `y-${s.getFullYear()}`,
    });
  }
  return buckets;
}

function gradientForIndex(i: number) {
  const palettes: [string, string][] = [
    ["#16a34a", "#22c55e"],
    ["#3b82f6", "#1d4ed8"],
    ["#a855f7", "#7e22ce"],
    ["#f97316", "#c2410c"],
  ];
  const p = palettes[i % palettes.length];
  return `linear-gradient(180deg, ${p[0]}, ${p[1]})`;
}

// não deixa o usuário avançar para além de HOJE
function nextClamped(mode: Mode, current: Date): Date {
  const today = new Date();
  const todayRef =
    mode === "day"
      ? startOfDay(today)
      : mode === "week"
      ? startOfWeekMonday(today)
      : mode === "month"
      ? startOfMonth(today)
      : startOfYear(today);

  const candidate =
    mode === "day"
      ? addDays(current, 1)
      : mode === "week"
      ? addWeeks(current, 1)
      : mode === "month"
      ? addMonths(current, 1)
      : addYears(current, 1);

  const candidateRef =
    mode === "day"
      ? startOfDay(candidate)
      : mode === "week"
      ? startOfWeekMonday(candidate)
      : mode === "month"
      ? startOfMonth(candidate)
      : startOfYear(candidate);

  if (candidateRef.getTime() > todayRef.getTime()) {
    // não avança
    return current;
  }
  return candidate;
}

export default function BarChart({
  type,
  title = "Receitas por período",
}: {
  type: TxType;
  title?: string;
}) {
  const [mode, setMode] = useState<Mode>("day");
  const [refDate, setRefDate] = useState<Date>(new Date());
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [rev, setRev] = useState(0); // bump sempre que o app emite evento

  // ouvir eventos globais pra recarregar quando algo muda
  useEffect(() => {
    const bump = () => setRev((x) => x + 1);
    if (typeof window !== "undefined") {
      window.addEventListener("finx:transactions-changed", bump);
      window.addEventListener("finx:storage", bump);
      window.addEventListener("storage", bump);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("finx:transactions-changed", bump);
        window.removeEventListener("finx:storage", bump);
        window.removeEventListener("storage", bump);
      }
    };
  }, []);

  // busca remota das transações
  useEffect(() => {
    const load = async () => {
      const buckets = bucketsFor(mode, refDate);
      if (buckets.length === 0) return;
      const first = buckets[0].start;
      const last = buckets[buckets.length - 1].end;

      const from = first.toISOString().slice(0, 10);
      const to = last.toISOString().slice(0, 10);

      try {
        const params = new URLSearchParams();
        params.set("type", type);
        params.set("from", from);
        params.set("to", to);

        const res = await fetch(`/api/transactions?${params.toString()}`, {
          credentials: "include", // 🔥 garante envio do cookie de login
          cache: "no-store",
        });
        if (!res.ok) {
          console.error(
            "Erro ao carregar transações para gráfico:",
            await res.text()
          );
          return;
        }
        const data = (await res.json()) as TxRow[];
        setTransactions(data);
      } catch (err) {
        console.error("Erro ao buscar transações para gráfico:", err);
      }
    };
    load();
  }, [mode, refDate, type, rev]);

  const buckets = useMemo(() => bucketsFor(mode, refDate), [mode, refDate]);

  const totals = useMemo(() => {
    if (transactions.length === 0) {
      return buckets.map((b) => ({ ...b, value: 0 }));
    }
    return buckets.map((b) => {
      let total = 0;
      const startTs = b.start.getTime();
      const endTs = b.end.getTime();
      for (const t of transactions) {
        if (t.type !== type) continue;
        const d = new Date(t.occurredAt);
        const ts = d.getTime();
        if (!Number.isFinite(ts)) continue;
        if (ts >= startTs && ts < endTs) {
          total += Number(t.amount || 0);
        }
      }
      return { ...b, value: total };
    });
  }, [buckets, transactions, type]);

  const max = totals.reduce((m, t) => (t.value > m ? t.value : m), 0) || 1;

  const goPrev = () => {
    setRefDate((d) => {
      switch (mode) {
        case "day":
          return addDays(d, -1);
        case "week":
          return addWeeks(d, -1);
        case "month":
          return addMonths(d, -1);
        case "year":
          return addYears(d, -1);
      }
    });
  };

  const goNext = () => {
    setRefDate((d) => nextClamped(mode, d));
  };

  const modeLabel =
    mode === "day"
      ? PT_WEEKDAYS[refDate.getDay()]
      : mode === "week"
      ? `semana de ${refDate.getDate()}/${refDate.getMonth() + 1}`
      : mode === "month"
      ? `${PT_MONTHS_SHORT[refDate.getMonth()]} ${refDate.getFullYear()}`
      : refDate.getFullYear();

  return (
    <article className="bc-root">
      <style jsx>{`
        .bc-root {
          background: #f0fdf4;
          border-radius: 24px;
          padding: 18px 18px 16px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.15);
          border: 1px solid rgba(22, 163, 74, 0.2);
        }
        .bc-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 4px;
          align-items: center;
        }
        .bc-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          text-align: center;
        }
        .bc-controls {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
        }
        .bc-mode {
          display: inline-flex;
          padding: 2px;
          border-radius: 999px;
          background: #e5f9ef;
          box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.2);
        }
        .bc-mode-btn {
          border: none;
          background: transparent;
          padding: 4px 12px;
          font-size: 13px;
          cursor: pointer;
          border-radius: 999px;
          color: #047857;
          min-width: 64px;
        }
        .bc-mode-btn.active {
          background: linear-gradient(135deg, #16a34a, #22c55e);
          color: #ecfdf5;
          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);
        }
        .bc-range-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }
        .bc-nav-btn {
          border-radius: 999px;
          border: none;
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: #ecfdf5;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
          color: #059669;
          font-size: 14px;
        }
        .bc-nav-label {
          font-size: 13px;
          color: #065f46;
          font-weight: 600;
        }
        .bc-chart {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: flex-end;
          gap: 18px;
          margin-top: 12px;
          height: 120px; /* altura fixa: o card não cresce/encolhe */
        }
        .bc-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .bc-bar {
          width: 40%; /* barra bem mais fina */
          max-width: 28px; /* limite de largura pequeno */
          border-radius: 0; /* cantos quadrados */
          background: linear-gradient(180deg, #22c55e, #15803d);
          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.25);
          transition: height 0.25s ease, transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .bc-bar:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.35);
        }
        .bc-label {
          text-align: center;
          line-height: 1.1;
        }
        .bc-x {
          font-size: 13px;
          color: #374151;
        }
        .bc-val {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        @media (max-width: 640px) {
          .bc-root {
            padding: 14px 12px 12px;
          }
          .bc-title {
            font-size: 18px;
          }
          .bc-chart {
            gap: 12px;
            height: 110px;
          }
        }
      `}</style>

      <header className="bc-header">
        <h3 className="bc-title">{title}</h3>

        <div className="bc-controls">
          <div className="bc-mode">
            {(["day", "week", "month", "year"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={"bc-mode-btn" + (mode === m ? " active" : "")}
                onClick={() => setMode(m)}
              >
                {m === "day"
                  ? "Dia"
                  : m === "week"
                  ? "Semana"
                  : m === "month"
                  ? "Mês"
                  : "Ano"}
              </button>
            ))}
          </div>

          <div className="bc-range-nav">
            <button
              type="button"
              className="bc-nav-btn"
              onClick={goPrev}
              aria-label="Período anterior"
            >
              {"<"}
            </button>
            <span className="bc-nav-label">{modeLabel}</span>
            <button
              type="button"
              className="bc-nav-btn"
              onClick={goNext}
              aria-label="Próximo período"
            >
              {">"}
            </button>
          </div>
        </div>
      </header>

      <div className="bc-chart">
        {totals.map((b, i) => {
          const h =
            b.value <= 0
              ? MIN_BAR_HEIGHT
              : Math.max(
                  MIN_BAR_HEIGHT,
                  Math.round((b.value / max) * MAX_BAR_HEIGHT)
                );
          return (
            <div key={b.key} className="bc-col">
              <div
                className="bc-bar"
                style={{ height: h, backgroundImage: gradientForIndex(i) }}
                title={`${b.label}: ${formatJPYStable(b.value)}`}
              />
              <div className="bc-label">
                <div className="bc-x">{b.label}</div>
                <div className="bc-val">{formatJPYStable(b.value)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
