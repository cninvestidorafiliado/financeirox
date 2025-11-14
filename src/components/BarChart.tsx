"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listTransactions } from "@/lib/storage";
import type { Income, Expense } from "@/types/finance";
import { formatJPYStable } from "@/lib/finance";

type Tx = Income | Expense;
type TxType = "INCOME" | "EXPENSE";
type Mode = "day" | "week" | "month" | "year";

type Bucket = {
  start: Date; // inclusive
  end: Date; // exclusive
  label: string;
  key: string;
};

const PT_WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const PT_MONTHS = [
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

/* ========= datas ========= */
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
  const wd = d.getDay();
  const delta = (wd + 6) % 7;
  return startOfDay(addDays(d, -delta));
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonthExclusive(d: Date) {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  end.setHours(0, 0, 0, 0);
  return end;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

/** Parse flexível */
function parseTxDateFlexible(s: string): Date | null {
  if (!s) return null;
  const main = s.includes("T") ? s.split("T")[0] : s;
  const sep = main.includes("-") ? "-" : main.includes("/") ? "/" : null;
  if (sep) {
    const p = main.split(sep);
    if (p.length === 3) {
      if (p[0].length === 4) {
        const y = +p[0],
          m = +p[1],
          d = +p[2];
        if (y && m && d) return new Date(y, m - 1, d);
      } else {
        const d = +p[0],
          m = +p[1],
          y = +p[2];
        if (y && m && d) return new Date(y, m - 1, d);
      }
    }
  }
  const n = new Date(s);
  if (!isNaN(n.getTime()))
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  return null;
}

function within(txDateStr: string, start: Date, end: Date) {
  const dt = parseTxDateFlexible(txDateStr);
  if (!dt) return false;
  const t = dt.getTime();
  return t >= start.getTime() && t < end.getTime();
}

function sumInRange(type: TxType, start: Date, end: Date) {
  const list = listTransactions();
  let total = 0;
  for (const t of list) {
    if (t.type !== type) continue;
    if (within((t as any).occurredAt, start, end)) total += Number(t.amount);
  }
  return total;
}

/* ========= buckets fixos (4 colunas) ========= */
function makeFixedBuckets(mode: Mode, now: Date): Bucket[] {
  if (mode === "day") {
    const today = startOfDay(now);
    const days: Bucket[] = [];
    for (let i = 3; i >= 0; i--) {
      const s = addDays(today, -i);
      const e = addDays(s, 1);
      const label = `${PT_WEEKDAYS[s.getDay()]}`;
      days.push({
        start: s,
        end: e,
        label,
        key: `d-${s.toISOString().slice(0, 10)}`,
      });
    }
    return days;
  }
  if (mode === "week") {
    const thisMon = startOfWeekMonday(now);
    const weeks: Bucket[] = [];
    for (let i = 3; i >= 0; i--) {
      const s = addDays(thisMon, -7 * i);
      const e = addDays(s, 7);
      const d1 = s.getDate().toString().padStart(2, "0");
      const d2 = addDays(e, -1).getDate().toString().padStart(2, "0");
      weeks.push({
        start: s,
        end: e,
        label: `${d1}–${d2}`,
        key: `w-${s.toISOString().slice(0, 10)}`,
      });
    }
    return weeks;
  }
  if (mode === "month") {
    const thisMonthStart = startOfMonth(now);
    const months: Bucket[] = [];
    for (let i = 3; i >= 0; i--) {
      const ref = addMonths(thisMonthStart, -i);
      const s = startOfMonth(ref);
      const e = endOfMonthExclusive(ref);
      const m = s.getMonth();
      const yy = (s.getFullYear() % 100).toString().padStart(2, "0");
      months.push({
        start: s,
        end: e,
        label: `${PT_MONTHS[m]}/${yy}`,
        key: `m-${s.getFullYear()}-${s.getMonth()}`,
      });
    }
    return months;
  }
  // year (3 anteriores + atual) — mantive 4 colunas
  const y = now.getFullYear();
  return [y - 3, y - 2, y - 1, y].map((yr) => ({
    start: new Date(yr, 0, 1),
    end: new Date(yr + 1, 0, 1),
    label: `${yr}`,
    key: `y-${yr}`,
  }));
}

function gradientForIndex(i: number) {
  const palettes = [
    ["#6d28d9", "#8b5cf6"],
    ["#3b82f6", "#60a5fa"],
    ["#06b6d4", "#22d3ee"],
    ["#10b981", "#34d399"],
    ["#f59e0b", "#fbbf24"],
    ["#ec4899", "#f472b6"],
  ];
  const p = palettes[i % palettes.length];
  return `linear-gradient(180deg, ${p[0]}, ${p[1]})`;
}

export default function BarChart({
  type,
  title = "Receitas Por Período",
}: {
  type: TxType;
  title?: string;
}) {
  const [mode, setMode] = useState<Mode>("month");

  // bump usado para re-render quando o storage mudar
  const [rev, setRev] = useState(0);
  useEffect(() => {
    const bump = () => setRev((x) => x + 1);
    if (typeof window !== "undefined") {
      window.addEventListener("finx:transactions-changed", bump);
      window.addEventListener("finx:storage", bump);
      window.addEventListener("storage", bump); // fallback entre abas
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("finx:transactions-changed", bump);
        window.removeEventListener("finx:storage", bump);
        window.removeEventListener("storage", bump);
      }
    };
  }, []);

  const now = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const buckets = useMemo(() => makeFixedBuckets(mode, now), [mode, now, rev]);

  const totals = useMemo(
    () =>
      buckets.map((b) => ({
        key: b.key,
        label: b.label,
        value: sumInRange(type, b.start, b.end),
      })),
    [buckets, type, rev]
  );

  const max = Math.max(1, ...totals.map((t) => t.value));

  return (
    <article className="card spring-card bc-wrap">
      <style jsx>{`
        .bc-wrap {
          padding: 16px 12px 8px;
        }
        .bc-header {
          display: grid;
          justify-items: center;
          gap: 10px;
          padding: 6px 6px 12px;
        }
        .bc-title {
          margin: 0;
          font-weight: 800;
          font-size: clamp(18px, 3.4vw, 28px);
          text-align: center;
        }
        .bc-mode {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }
        .bc-btn {
          background: #f3f4f6;
          color: #111827;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: clamp(12px, 2.8vw, 16px);
        }
        .bc-btn.active {
          background: #10b981;
          color: #fff;
        }
        .bc-chart {
          display: grid;
          grid-template-columns: repeat(4, minmax(48px, 1fr));
          align-items: end;
          gap: clamp(12px, 4vw, 28px);
          height: clamp(180px, 42vw, 260px);
          padding: 10px clamp(8px, 3vw, 28px) 0;
        }
        .bc-col {
          display: grid;
          justify-items: center;
          gap: clamp(6px, 1.6vw, 10px);
        }
        .bc-bar {
          width: clamp(18px, 4.4vw, 34px);
          border-radius: 10px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        }
        .bc-label {
          display: grid;
          justify-items: center;
          gap: 4px;
        }
        .bc-x {
          font-size: clamp(12px, 2.8vw, 16px);
          color: #374151;
        }
        .bc-val {
          font-size: clamp(12px, 2.8vw, 16px);
          font-weight: 800;
        }
      `}</style>

      <header className="bc-header">
        <h3 className="bc-title">{title}</h3>
        <div className="bc-mode">
          {(["day", "week", "month", "year"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`btn bc-btn ${mode === m ? "active" : ""}`}
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
      </header>

      <div className="bc-chart">
        {totals.map((t, i) => {
          const h = Math.max(6, Math.round((t.value / max) * 190));
          return (
            <div key={t.key} className="bc-col">
              <div
                className="bc-bar"
                style={{ height: h, backgroundImage: gradientForIndex(i) }}
                title={`${t.label}: ${formatJPYStable(t.value)}`}
              />
              <div className="bc-label">
                <div className="bc-x">{t.label}</div>
                <div className="bc-val">{formatJPYStable(t.value)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <footer style={{ height: 4 }} />
    </article>
  );
}
