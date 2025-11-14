"use client";
import React from "react";

export default function BalanceCard({
  monthLabel,
  income,
  expense,
  balance,
  hideBalance,
  onToggleHide,
  onPrevMonth,
  onNextMonth,
  nextDisabled,
  format,
}: {
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
  hideBalance: boolean;
  onToggleHide: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  nextDisabled: boolean;
  format: (n: number) => string;
}) {
  return (
    <article className="card hero-balance spring-card">
      <div className="hero-toolbar">
        <button
          className="icon-btn"
          onClick={onPrevMonth}
          aria-label="Mês anterior"
        >
          ◀
        </button>
        <div className="pill">
          <span style={{ textTransform: "capitalize" }}>{monthLabel}</span>
        </div>
        <button
          className="icon-btn"
          onClick={onNextMonth}
          aria-label="Próximo mês"
          disabled={nextDisabled}
        >
          ▶
        </button>
        <button
          className="hero-eye"
          onClick={onToggleHide}
          aria-label="Mostrar/Ocultar saldo"
        >
          👁️
        </button>
      </div>

      <div className="hero-balance-row">
        <div className={`hero-balance-value ${balance < 0 ? "neg" : "pos"}`}>
          {hideBalance ? "•••••" : format(balance)}
        </div>
      </div>

      <div className="hero-mini">
        <div className="hero-mini-item ok">
          <span className="mini-dot">↑</span>
          <div>
            <div className="mini-title">Receitas</div>
            <div className="mini-value">
              {hideBalance ? "•••" : format(income)}
            </div>
          </div>
        </div>
        <div className="hero-mini-item warn">
          <span className="mini-dot">↓</span>
          <div>
            <div className="mini-title">Despesas</div>
            <div className="mini-value">
              {hideBalance ? "•••" : format(expense)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
