"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonthRange } from "@/lib/storage";
import { formatJPYStable } from "@/lib/finance";
import BalanceCard from "@/components/BalanceCard";
// import DonutPairCard from "@/components/DonutPairCard"; // mantendo comentado conforme versão atual
import DonutChart from "@/components/DonutChart";
import BarChart from "@/components/BarChart";
import TaxSummaryCard from "@/components/TaxSummaryCard";

type CatSlice = { label: string; total: number; color: string };

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

type Tx = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  expenseCategory?: string | null;
  incomeSource?: string | null;
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [hideBalance, setHideBalance] = useState(false);

  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [expenseCats, setExpenseCats] = useState<CatSlice[]>([]);
  const [incomeCats, setIncomeCats] = useState<CatSlice[]>([]); // guardado p/ futuro

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setToday(now);
    setCurrentDate(new Date());
  }, []);

  // ===========================
  //  BUSCA DADOS DO MÊS NA API
  //  (Balance + Donut)
  // ===========================
  useEffect(() => {
    if (!mounted || !currentDate) return;

    const range = getMonthRange(currentDate);
    const from = range.start.toISOString().slice(0, 10);
    const to = range.end.toISOString().slice(0, 10);

    const load = async () => {
      try {
        const params = new URLSearchParams();
        params.set("from", from);
        params.set("to", to);

        const res = await fetch(`/api/transactions?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          console.error(
            "Erro ao carregar dados do dashboard:",
            await res.text()
          );
          setIncome(0);
          setExpense(0);
          setExpenseCats([]);
          setIncomeCats([]);
          return;
        }

        const all = (await res.json()) as Tx[];

        const incomes = all.filter((t) => t.type === "INCOME");
        const expenses = all.filter((t) => t.type === "EXPENSE");

        const sum = (arr: Tx[]) =>
          arr.reduce((s, t) => s + Number(t.amount || 0), 0);

        setIncome(sum(incomes));
        setExpense(sum(expenses));

        const makeMap = (
          arr: Tx[],
          key: "expenseCategory" | "incomeSource"
        ) => {
          const m = new Map<string, number>();
          for (const it of arr) {
            const raw = (it[key] ?? "Outros") as string;
            const k = raw.trim() || "Outros";
            m.set(k, (m.get(k) ?? 0) + Number(it.amount || 0));
          }
          return m;
        };

        const expMap = makeMap(expenses, "expenseCategory");
        const incMap = makeMap(incomes, "incomeSource");

        const pal1 = [
          "#7dd3fc",
          "#86efac",
          "#fbcfe8",
          "#fde68a",
          "#c7d2fe",
          "#a7f3d0",
          "#fecaca",
        ];
        const pal2 = [
          "#a5f3fc",
          "#bbf7d0",
          "#f9a8d4",
          "#fef08a",
          "#ddd6fe",
          "#6ee7b7",
          "#fca5a5",
        ];

        const mapToArr = (
          map: Map<string, number>,
          palette: string[]
        ): CatSlice[] =>
          Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([label, total], i) => ({
              label,
              total,
              color: palette[i % palette.length],
            }));

        setExpenseCats(mapToArr(expMap, pal1));
        setIncomeCats(mapToArr(incMap, pal2));
      } catch (err) {
        console.error("Erro ao chamar /api/transactions para dashboard:", err);
        setIncome(0);
        setExpense(0);
        setExpenseCats([]);
        setIncomeCats([]);
      }
    };

    load();

    // Recarrega quando qualquer transação é alterada em outra tela
    if (typeof window !== "undefined") {
      const handler = () => load();
      window.addEventListener("finx:transactions-changed", handler);
      return () =>
        window.removeEventListener("finx:transactions-changed", handler);
    }
  }, [mounted, currentDate]);

  const monthLabel = useMemo(() => {
    if (!currentDate) return "";
    return `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate]);

  const prevMonth = () =>
    setCurrentDate((d) =>
      d ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : d
    );

  const nextMonth = () =>
    setCurrentDate((d) => {
      if (!d) return d;
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const now = new Date();
      return next > now ? d : next;
    });

  return (
    <main className="app-main spring">
      <header className="page-head">
        <h2 className="page-title">Saldo Atual</h2>
      </header>

      {!mounted || !today || !currentDate ? (
        <section className="dash-grid">
          <article className="card spring-card" style={{ height: 120 }} />
          <article className="card spring-card" style={{ height: 320 }} />
          <article className="card spring-card" style={{ height: 320 }} />
        </section>
      ) : (
        <section className="dash-grid">
          <BalanceCard
            monthLabel={monthLabel}
            income={income}
            expense={expense}
            balance={income - expense}
            hideBalance={hideBalance}
            onToggleHide={() => setHideBalance((v) => !v)}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            nextDisabled={
              currentDate.getFullYear() === today.getFullYear() &&
              currentDate.getMonth() === today.getMonth()
            }
            format={formatJPYStable}
          />

          {/* Donut único — despesas por categoria */}
          <DonutChart data={expenseCats} />

          {/* BarChart original, com a tipagem correta */}
          <BarChart type="INCOME" title="Receitas por período" />
          {/* Se quiser o de despesas também, descomente a linha abaixo:
              <BarChart type="EXPENSE" title="Despesas por período" />
          */}
        </section>
      )}

      {/* NOVO CARD DE IMPOSTO */}
      <TaxSummaryCard />

      <style jsx>{`
        .dash-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .page-title {
          text-align: center;
          font-size: 1.8rem;
          margin: 10px 0;
        }
      `}</style>
    </main>
  );
}
