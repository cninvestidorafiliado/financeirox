"use client";
import { useEffect, useMemo, useState } from "react";
import { getMonthRange, listByTypeInMonth } from "@/lib/storage";
import { formatJPYStable, Expense, Income } from "@/lib/finance";

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

// util seguro para construir datas sem mutar o estado original
function monthShift(base: Date, offset: number) {
  return new Date(base.getFullYear(), base.getMonth() + offset, 1);
}
// trava navegação para não passar do mês atual
function isSameYearMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function isAfterYearMonth(a: Date, b: Date) {
  if (a.getFullYear() > b.getFullYear()) return true;
  if (a.getFullYear() < b.getFullYear()) return false;
  return a.getMonth() > b.getMonth();
}

export default function RelatorioPage() {
  // ancoramos "hoje" uma única vez
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);

  const [currentDate, setCurrentDate] = useState<Date>(today);

  const range = useMemo(() => getMonthRange(currentDate), [currentDate]);

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [byCat, setByCat] = useState<{ label: string; total: number }[]>([]);

  useEffect(() => {
    const inc = listByTypeInMonth("INCOME", range) as Income[];
    const exp = listByTypeInMonth("EXPENSE", range) as Expense[];
    setIncomes(inc);
    setExpenses(exp);

    const map = new Map<string, number>();
    exp.forEach((e) => {
      const k = (e.expenseCategory || "Outros").trim() || "Outros";
      map.set(k, (map.get(k) ?? 0) + Number(e.amount || 0));
    });
    setByCat(
      Array.from(map.entries())
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => b.total - a.total)
    );
  }, [range.start, range.end]);

  const totalInc = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const saldo = totalInc - totalExp;

  const prevMonth = () => setCurrentDate((d) => monthShift(d, -1));
  const canGoNext =
    !isSameYearMonth(currentDate, today) &&
    !isAfterYearMonth(currentDate, today);
  const nextMonth = () => {
    if (canGoNext) setCurrentDate((d) => monthShift(d, +1));
  };

  const monthLabel = `${
    MESES[currentDate.getMonth()]
  } ${currentDate.getFullYear()}`;

  // formato estável DD-MM-AAAA para evitar hidratação divergente
  const fmtDMY = (iso: string) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  return (
    <main className="app-main">
      {/* Wrapper com classes padronizadas para o CSS alinhar título e seletor */}
      <div className="tx-screen tx-report">
        <div className="card page-frame">
          {/* header em coluna: título em cima, seletor logo abaixo */}
          <header className="report-header">
            <h2 className="page-title">Relatório do Mês</h2>

            <div className="month-nav">
              <button
                className="icon-btn"
                onClick={prevMonth}
                aria-label="Mês anterior"
                title="Mês anterior"
              >
                ◀
              </button>

              <div
                className="pill month-label"
                style={{ textTransform: "capitalize" }}
              >
                {monthLabel}
              </div>

              <button
                className="icon-btn"
                onClick={nextMonth}
                aria-label="Próximo mês"
                title="Próximo mês"
                disabled={!canGoNext}
                style={
                  !canGoNext
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : undefined
                }
              >
                ▶
              </button>
            </div>
          </header>

          {/* Resumo */}
          <section className="tp-grid" style={{ marginBottom: 16 }}>
            <div className="card">
              <h3>Receitas</h3>
              <p className="value" suppressHydrationWarning>
                {formatJPYStable(totalInc)}
              </p>
              <small>Total de lançamentos: {incomes.length}</small>
            </div>
            <div className="card">
              <h3>Despesas</h3>
              <p className="value" suppressHydrationWarning>
                {formatJPYStable(totalExp)}
              </p>
              <small>Total de lançamentos: {expenses.length}</small>
            </div>
          </section>

          {/* Tabela de receitas */}
          <section className="card" style={{ marginTop: 16 }}>
            <h3>Receitas</h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Origem</th>
                    <th>Valor</th>
                    <th>Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted-center">
                        Nenhuma receita registrada.
                      </td>
                    </tr>
                  )}
                  {incomes.map((i) => (
                    <tr key={i.id}>
                      <td data-label="Data">{fmtDMY(i.occurredAt)}</td>
                      <td data-label="Origem">{i.incomeSource}</td>
                      <td data-label="Valor" suppressHydrationWarning>
                        {formatJPYStable(i.amount)}
                      </td>
                      <td data-label="Obs.">{i.notes ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tabela de despesas */}
          <section className="card" style={{ marginTop: 16 }}>
            <h3>Despesas</h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted-center">
                        Nenhuma despesa registrada.
                      </td>
                    </tr>
                  )}
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td data-label="Data">{fmtDMY(e.occurredAt)}</td>
                      <td data-label="Categoria">{e.expenseCategory}</td>
                      <td data-label="Valor" suppressHydrationWarning>
                        {formatJPYStable(e.amount)}
                      </td>
                      <td data-label="Obs.">{e.notes ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Por categoria + saldo */}
          <section className="card" style={{ marginTop: 16 }}>
            <h3>Despesas por categoria</h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {byCat.length === 0 && (
                    <tr>
                      <td colSpan={2} className="muted-center">
                        Sem despesas neste mês.
                      </td>
                    </tr>
                  )}
                  {byCat.map((c) => (
                    <tr key={c.label}>
                      <td data-label="Categoria">{c.label}</td>
                      <td data-label="Total" suppressHydrationWarning>
                        {formatJPYStable(c.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>
                      <strong>Saldo do mês</strong>
                    </td>
                    <td
                      suppressHydrationWarning
                      style={{
                        fontWeight: 800,
                        color: saldo < 0 ? "#d93025" : "#0f9d58",
                      }}
                    >
                      {formatJPYStable(saldo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
