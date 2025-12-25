"use client";
import { useEffect, useMemo, useState } from "react";
import { getMonthRange } from "@/lib/storage";
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
    async function load() {
      try {
        // monta intervalo YYYY-MM-DD para a API
        const from = range.start.toISOString().slice(0, 10);
        const to = range.end.toISOString().slice(0, 10);
        const params = new URLSearchParams();
        params.set("from", from);
        params.set("to", to);

        const res = await fetch(`/api/transactions?${params.toString()}`);
        if (!res.ok) {
          console.error(
            "Erro ao carregar transações para relatório:",
            await res.text()
          );
          setIncomes([]);
          setExpenses([]);
          setByCat([]);
          return;
        }

        const raw = (await res.json()) as any[];

        // normaliza o formato vindo do backend para Income/Expense usados na UI
        const mapped = raw.map((tx) => {
          const base = {
            id: String(tx.id),
            type: tx.type as "INCOME" | "EXPENSE",
            amount: Number(tx.amount ?? 0),
            occurredAt:
              typeof tx.occurredAt === "string"
                ? tx.occurredAt.slice(0, 10)
                : new Date(tx.occurredAt).toISOString().slice(0, 10),
            notes: tx.notes ?? "",
          };

          if (base.type === "INCOME") {
            const inc: Income = {
              ...base,
              type: "INCOME",
              incomeSource: tx.incomeSource ?? "",
            };
            return inc;
          } else {
            const exp: Expense = {
              ...base,
              type: "EXPENSE",
              expenseCategory: tx.expenseCategory ?? "",
              payMethod:
                (tx.payMethod as "CASH" | "CREDIT_CARD" | "APP") ?? "CASH",
              payApp: tx.payApp ?? undefined,
            };
            return exp;
          }
        });

        const incs = mapped.filter((t) => t.type === "INCOME") as Income[];
        const exps = mapped.filter((t) => t.type === "EXPENSE") as Expense[];

        setIncomes(incs);
        setExpenses(exps);

        // monta o mapa de despesas por categoria
        const map = new Map<string, number>();
        exps.forEach((e) => {
          const k = (e.expenseCategory || "Outros").trim() || "Outros";
          map.set(k, (map.get(k) ?? 0) + Number(e.amount || 0));
        });
        setByCat(
          Array.from(map.entries())
            .map(([label, total]) => ({ label, total }))
            .sort((a, b) => b.total - a.total)
        );
      } catch (err) {
        console.error("Erro inesperado ao carregar relatório:", err);
        setIncomes([]);
        setExpenses([]);
        setByCat([]);
      }
    }

    load();
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

  // 🔹 Agrupamento de datas: mesma lógica visual da tela de Transações
  const incomesWithFlag = useMemo(() => {
    const sorted = [...incomes].sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt)
    );
    let lastDate: string | null = null;
    return sorted.map((i) => {
      const showDate = i.occurredAt !== lastDate;
      lastDate = i.occurredAt;
      return { ...i, showDate };
    });
  }, [incomes]);

  const expensesWithFlag = useMemo(() => {
    const sorted = [...expenses].sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt)
    );
    let lastDate: string | null = null;
    return sorted.map((e) => {
      const showDate = e.occurredAt !== lastDate;
      lastDate = e.occurredAt;
      return { ...e, showDate };
    });
  }, [expenses]);

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
                  {incomesWithFlag.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted-center">
                        Nenhuma receita registrada.
                      </td>
                    </tr>
                  )}
                  {incomesWithFlag.map((i) => (
                    <tr key={i.id}>
                      <td data-label="Data">
                        {i.showDate ? fmtDMY(i.occurredAt) : ""}
                      </td>
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
                  {expensesWithFlag.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted-center">
                        Nenhuma despesa registrada.
                      </td>
                    </tr>
                  )}
                  {expensesWithFlag.map((e) => (
                    <tr key={e.id}>
                      <td data-label="Data">
                        {e.showDate ? fmtDMY(e.occurredAt) : ""}
                      </td>
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
