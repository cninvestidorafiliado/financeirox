"use client";
import React from "react";
import { formatJPYStable } from "@/lib/finance";

type Slice = { label: string; total: number; color: string };
type PanelProps = { title: string; data: Slice[] };

function DonutPanel({ title, data }: PanelProps) {
  const total = data.reduce((s, c) => s + c.total, 0);
  let offset = 0;

  return (
    <section className="donut-panel">
      <header className="panel-head">
        <h3>{title}</h3>
      </header>

      <div className="panel-body">
        <div className="ring-wrap">
          {/* Donut centralizado */}
          <svg
            viewBox="0 0 160 160"
            preserveAspectRatio="xMidYMid meet"
            className="ring"
            style={{
              width: "clamp(120px, 16vw, 180px)",
              height: "clamp(120px, 16vw, 180px)",
              flex: "0 0 auto",
            }}
            aria-label={`${title} – total ${formatJPYStable(total)}`}
          >
            <circle
              cx="80"
              cy="80"
              r="64"
              stroke="#eef2f7"
              strokeWidth="16"
              fill="none"
            />
            {(data.length === 0
              ? [{ label: "", total: 1, color: "#e8eef5" }]
              : data
            ).map((c, idx) => {
              const pct =
                total > 0 ? (c.total / total) * 100 : idx === 0 ? 100 : 0;
              const el = (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke={c.color}
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

          {/* Total centralizado logo abaixo do donut */}
          <div className="total-badge" aria-hidden="true">
            Total: {formatJPYStable(total)}
          </div>
        </div>

        <ul className="legend">
          {data.length > 0 ? (
            data.map((c) => (
              <li key={c.label}>
                <span className="dot" style={{ background: c.color }} />
                <span>{c.label}</span>
                <span>{formatJPYStable(c.total)}</span>
              </li>
            ))
          ) : (
            <li className="legend-empty">Não informado.</li>
          )}
        </ul>
      </div>
      <style jsx>{`
        .panel-head {
          display: flex;
          align-items: center;
          justify-content: center; /* ← centraliza o título */
          margin-bottom: 6px;
        }
        .panel-body {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 16px;
          align-items: center;
          min-height: 0;
        }
        .ring-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 220px;
        }
        .ring {
          max-width: 100%;
          height: auto;
        }
        .total-badge {
          margin-top: 10px;
          padding: 4px 10px;
          font-size: 12px;
          color: #334155;
          background: #f3f6fb;
          border: 1px solid #e5ecf5;
          border-radius: 999px;
          line-height: 1;
          text-align: center;
        }
        .legend {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 170px;
          overflow: auto;
          display: grid;
          gap: 8px;
        }
        .legend li {
          display: grid;
          grid-template-columns: 14px 1fr auto;
          gap: 8px;
          align-items: center;
          padding: 6px 10px;
          border-radius: 10px;
          background: #fafafa;
        }
        .legend-empty {
          padding: 10px;
          border-radius: 10px;
          background: #fafafa;
          color: #7a8796;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
        }
        @media (max-width: 560px) {
          .panel-body {
            grid-template-columns: 1fr;
            justify-items: center;
          }
          .ring-wrap {
            min-width: 0;
          }
        }
      `}</style>
    </section>
  );
}

export default function DonutPairCard({
  left,
  right,
}: {
  left: PanelProps;
  right: PanelProps;
}) {
  return (
    <article className="card spring-card donut-pair">
      <DonutPanel {...left} />
      <DonutPanel {...right} />
      <style jsx>{`
        .donut-pair {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 1.5rem;
          align-items: stretch;
          min-height: 300px;
        }
        .donut-panel {
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 0;
        }
      `}</style>
    </article>
  );
}
