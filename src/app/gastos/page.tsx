"use client";
import ClientOnly from "@/components/ClientOnly";
import TransactionsPage from "@/components/TransactionsPage";
import ManageExpenseCategoriesCard from "@/components/ManageExpenseCategoriesCard";

export default function GastosPage() {
  return (
    <div
      className="tx-screen tx-expense"
      style={{ display: "grid", gap: 16, alignContent: "start" }}
    >
      {/* (2) Lista do mês + (3) Adicionar Gasto */}
      <ClientOnly>
        <TransactionsPage type="EXPENSE" />
      </ClientOnly>

      {/* (1) Categorias — apenas no cliente */}
      <ClientOnly>
        <ManageExpenseCategoriesCard compact />
      </ClientOnly>
    </div>
  );
}
