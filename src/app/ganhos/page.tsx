"use client";
import ClientOnly from "@/components/ClientOnly";
import TransactionsPage from "@/components/TransactionsPage";
import ManageIncomeSourcesCard from "@/components/ManageIncomeSourcesCard";

export default function GanhosPage() {
  return (
    <div
      className="tx-screen tx-income"
      style={{ display: "grid", gap: 16, alignContent: "start" }}
    >
      {/* (2) Lista do mês + (3) Adicionar Ganho */}
      <ClientOnly>
        <TransactionsPage type="INCOME" />
      </ClientOnly>

      {/* (1) Tipos de origem — render only client para evitar hidratação com extensões */}
      <ClientOnly>
        <ManageIncomeSourcesCard compact />
      </ClientOnly>
    </div>
  );
}
