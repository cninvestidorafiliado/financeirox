"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMonthRange } from "@/lib/storage";
import { formatJPYStable } from "@/lib/finance";
import BalanceCard from "@/components/BalanceCard";
import DonutChart from "@/components/DonutChart";
import BarChart from "@/components/BarChart";
import TaxSummaryCard from "@/components/TaxSummaryCard";

type CatSlice = { label: string; total: number; color: string };

type Tx = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  incomeSource?: string | null;
  expenseCategory?: string | null;
  occurredAt: string; // precisa para separar atual x futuro
};

type SourceConfig = {
  name: string;
  workWeekStart: number;
  paymentWeekday: number;
};

export default function HomePage() {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [hideBalance, setHideBalance] = useState(false);

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [sourceConfigs, setSourceConfigs] = useState<SourceConfig[]>([]);

  const [expenseCats, setExpenseCats] = useState<CatSlice[]>([]);
  const [incomeCats, setIncomeCats] = useState<CatSlice[]>([]); // guardado p/ futuro

  useEffect(() => {
    const load = async () => {
      try {
        const range = getMonthRange(currentDate);
        const params = new URLSearchParams({
          from: range.start.toISOString().slice(0, 10),
          to: range.end.toISOString().slice(0, 10),
        });

        const [txRes, srcRes] = await Promise.all([
          fetch(`/api/transactions?${params.toString()}`, {
            cache: "no-store",
          }),
          fetch("/api/sources", { cache: "no-store" }),
        ]);

        // se a sessão expirou, volta para o login
        if (txRes.status === 401 || srcRes.status === 401) {
          router.replace("/login");
          return;
        }

        if (!txRes.ok || !srcRes.ok) {
          console.error(
            "Erro ao carregar dashboard:",
            txRes.status,
            srcRes.status
          );
          setTransactions([]);
          setSourceConfigs([]);
          setExpenseCats([]);
          setIncomeCats([]);
          return;
        }

        const txs = (await txRes.json()) as Tx[];
        const srcJson = await srcRes.json();

        // /api/sources pode devolver array puro ou objeto { incomeSources, ... }
        const incomeSourcesRaw: any[] = Array.isArray(srcJson)
          ? srcJson
          : srcJson.incomeSources ?? [];

        const incomeSources: SourceConfig[] = incomeSourcesRaw
          .filter((s) => s.kind === "INCOME" || !s.kind) // segurança
          .map((s) => ({
            name: s.name as string,
            workWeekStart:
              typeof s.workWeekStart === "number" ? s.workWeekStart : 1, // fallback segunda
            paymentWeekday:
              typeof s.paymentWeekday === "number" ? s.paymentWeekday : 3, // fallback quarta
          }));

        setTransactions(txs);
        setSourceConfigs(incomeSources);

        // ===== Donut / gráficos =====
        const expenses = txs.filter((t) => t.type === "EXPENSE");
        const incomes = txs.filter((t) => t.type === "INCOME");

        const makeMap = (
          arr: Tx[],
          key: "expenseCategory" | "incomeSource"
        ) => {
          const m = new Map<string, number>();
          for (const t of arr) {
            const k = (t[key] ?? "Outros").trim() || "Outros";
            m.set(k, (m.get(k) ?? 0) + t.amount);
          }
          return m;
        };

        const pal1 = ["#7dd3fc", "#86efac", "#fbcfe8", "#fde68a", "#c7d2fe"];
        const pal2 = ["#a5f3fc", "#bbf7d0", "#f9a8d4", "#fef08a", "#ddd6fe"];

        const toArr = (map: Map<string, number>, pal: string[]): CatSlice[] =>
          Array.from(map.entries()).map(([label, total], i) => ({
            label,
            total,
            color: pal[i % pal.length],
          }));

        setExpenseCats(toArr(makeMap(expenses, "expenseCategory"), pal1));
        setIncomeCats(toArr(makeMap(incomes, "incomeSource"), pal2));
      } catch (err) {
        console.error("Erro inesperado ao carregar dashboard:", err);
        setTransactions([]);
        setSourceConfigs([]);
        setExpenseCats([]);
        setIncomeCats([]);
      }
    };

    load();

    // recarrega quando algo muda em outra tela (emitido pela tela de cadastro)
    if (typeof window !== "undefined") {
      const handler = () => load();
      window.addEventListener("finx:transactions-changed", handler);
      return () =>
        window.removeEventListener("finx:transactions-changed", handler);
    }
  }, [currentDate, router]);

  const monthLabel = useMemo(
    () =>
      currentDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    [currentDate]
  );

  const prevMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));

  const nextMonth = () =>
    setCurrentDate((d) => {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const now = new Date();
      return next > now ? d : next;
    });

  return (
    <main className="app-main spring">
      <header className="page-head">
        <h2 className="page-title">Saldo Atual</h2>
      </header>

      <section className="dash-grid">
        <BalanceCard
          monthLabel={monthLabel}
          transactions={transactions}
          sourceConfigs={sourceConfigs}
          format={formatJPYStable}
          hideBalance={hideBalance}
          onToggleHide={() => setHideBalance((v) => !v)}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          nextDisabled={false}
        />

        <DonutChart data={expenseCats} />

        <BarChart type="INCOME" title="Receitas por período" />
      </section>

      <TaxSummaryCard />

      <style jsx>{`
        .dash-grid {
          display: flex;
          flex-direction: column;
          align-items: stretch; /* 🔥 evita overflow */
          width: 100%;
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
