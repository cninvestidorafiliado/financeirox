"use client";
import React from "react";
import { formatJPYStable } from "@/lib/finance";

type Slice = { label: string; total: number; color: string };

export default function DonutChart({
  data,
  title = "Despesas por categoria",
}: {
  data: Slice[];
  title?: string;
}) {
  const total = data.reduce((s, c) => s + Number(c.total || 0), 0);
  let offset = 0;

  return (
    <article className="card spring-card centered-card donut-one">
      <header className="chart-head">
        <h3>{title}</h3>
      </header>

      <div className="donut-wrap">
        <div className="ring-col">
          <svg
            viewBox="0 0 160 160"
            className="donut-svg"
            preserveAspectRatio="xMidYMid meet"
            aria-label={`${title} — total ${formatJPYStable(total)}`}
          >
            {/* trilha */}
            <circle
              cx="80"
              cy="80"
              r="64"
              stroke="#eef2f7"
              strokeWidth="16"
              fill="none"
            />
            {/* fatias */}
            {(data.length
              ? data
              : [{ label: "", total: 1, color: "#e8eef5" }]
            ).map((s, i) => {
              const pct =
                total > 0 ? (Number(s.total) / total) * 100 : i === 0 ? 100 : 0;
              const el = (
                <circle
                  key={i}
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="16"
                  pathLength={100}
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                  strokeLinecap="round"
                />
              );
              offset += pct;
              return el;
            })}
          </svg>

          <div className="total-badge">Total: {formatJPYStable(total)}</div>
        </div>

        {/* WRAP com padding lateral para evitar “encostar” nas bordas do card */}
        <div className="legend-wrap">
          <ul className="legend">
            {data.length ? (
              data.map((s) => (
                <li key={s.label} className="legend-item">
                  <span className="dot" style={{ background: s.color }} />
                  <span className="label">{s.label}</span>
                  <span className="val">
                    {formatJPYStable(Number(s.total))}
                  </span>
                </li>
              ))
            ) : (
              <li className="legend-empty">Não informado.</li>
            )}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .centered-card {
          display: flex !important;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
          padding: 16px 12px; /* padding interno do card */
        }

        .chart-head {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 6px;
          width: 100%;
          text-align: center;
        }
        .chart-head h3 {
          margin: 6px 0 2px;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .donut-wrap {
          width: 100%;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 16px;
          align-items: center;
          justify-items: center;
        }

        .ring-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 220px;
        }

        .donut-svg {
          width: clamp(120px, 16vw, 180px);
          height: clamp(120px, 16vw, 180px);
          max-width: 100%;
        }

        .total-badge {
          margin-top: 10px;
          padding: 6px 12px;
          font-size: 13.5px;
          color: #334155;
          background: #f3f6fb;
          border: 1px solid #e5ecf5;
          border-radius: 999px;
          line-height: 1;
        }

        /* padding lateral para a legenda não “colar” nas bordas do card no mobile */
        .legend-wrap {
          width: 100%;
          padding: 0 12px 8px;
          box-sizing: border-box;
        }

        .legend {
          list-style: none;
          padding: 0;
          margin: 0 auto; /* centraliza */
          width: 100%;
          max-width: 520px;
          max-height: 180px;
          overflow: auto;
          display: grid;
          gap: 8px;
        }

        .legend-item {
          display: grid;
          grid-template-columns: 14px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #fafafa;
          border-radius: 10px;
          border: 1px solid #eef2f7;
        }
        .legend-empty {
          padding: 10px 12px;
          background: #fafafa;
          border-radius: 10px;
          color: #7a8796;
          border: 1px solid #eef2f7;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
        }
        .label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: left;
        }
        .val {
          font-weight: 700;
        }

        @media (max-width: 560px) {
          .donut-wrap {
            grid-template-columns: 1fr;
          }
          .ring-col {
            min-width: 0;
          }
        }
      `}</style>
    </article>
  );
}
