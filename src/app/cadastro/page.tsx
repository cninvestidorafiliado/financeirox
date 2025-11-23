"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AddTransactionForm from "@/components/AddTransactionForm";
import ManageIncomeSourcesCard from "@/components/ManageIncomeSourcesCard";
import ManageExpenseCategoriesCard from "@/components/ManageExpenseCategoriesCard";

export default function CadastroPage() {
  const router = useRouter();

  const afterSave = () => {
    alert("Salvo com sucesso! Você pode conferir em Transações.");
    router.refresh();
  };

  // Feedback visual quando cadastrar/alterar origem ou categoria
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      alert("Cadastro atualizado com sucesso (origens/categorias).");
    };

    window.addEventListener("finx:sources-changed", handler);
    return () => window.removeEventListener("finx:sources-changed", handler);
  }, []);

  return (
    <div className="create-screen">
      <h1 className="title">Cadastro Rápido</h1>

      <section className="grid2">
        <article className="card">
          <h3>Adicionar Ganho</h3>
          <AddTransactionForm type="INCOME" onSaved={afterSave} />
        </article>

        <article className="card">
          <h3>Adicionar Gasto</h3>
          <AddTransactionForm type="EXPENSE" onSaved={afterSave} />
        </article>
      </section>

      <section className="grid2">
        <ManageIncomeSourcesCard compact />
        <ManageExpenseCategoriesCard compact />
      </section>

      <style jsx>{`
        .create-screen {
          max-width: 980px;
          margin: 0 auto;
          padding: 12px;
          display: grid;
          gap: 16px;
        }
        .title {
          text-align: center;
          font: 800 24px/1.1 Inter, system-ui, sans-serif;
          margin: 6px 0 4px;
        }
        .grid2 {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 900px) {
          .grid2 {
            grid-template-columns: 1fr 1fr;
          }
        }
        .card {
          background: #fff;
          border: 1px solid #eef2f7;
          border-radius: 14px;
          padding: 12px;
          box-shadow: 0 6px 24px rgba(2, 8, 20, 0.03);
        }
        .card h3 {
          margin: 2px 0 12px;
          font: 800 16px/1.1 Inter;
        }
      `}</style>
    </div>
  );
}
