"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addExpenseCategory,
  listExpenseCategories,
  removeExpenseCategory,
  pickColor,
} from "@/lib/storage";

type NamedItem = { id: string; name: string; color?: string };
type Props = { compact?: boolean };

export default function ManageExpenseCategoriesCard({
  compact = false,
}: Props) {
  const router = useRouter();

  // Evita hidratação: carrega a lista só no cliente
  const [cats, setCats] = useState<NamedItem[] | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    setCats(listExpenseCategories());
  }, []);

  const refreshAll = () => {
    router.refresh();
    // window.location.reload();
  };

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    addExpenseCategory(n, pickColor(n.length));
    setName("");
    setCats(listExpenseCategories());
    refreshAll();
  };

  const onDel = (id: string) => {
    removeExpenseCategory(id);
    setCats(listExpenseCategories());
    refreshAll();
  };

  const pad = compact ? 12 : 16;
  const gap = compact ? 8 : 10;
  const maxW = compact ? 720 : 980;

  return (
    <article
      className="card spring-card"
      style={{
        padding: pad,
        width: "100%",
        maxWidth: maxW,
        justifySelf: "center",
      }}
    >
      <h3 style={{ textAlign: "center", margin: 0, marginBottom: 8 }}>
        Categorias de Gastos
      </h3>

      <form
        onSubmit={onAdd}
        suppressHydrationWarning
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap,
          marginBottom: gap + 4,
        }}
      >
        <input
          placeholder="Ex.: Alimentação, Transporte, Manutenção…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn">
          Adicionar
        </button>
      </form>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap,
        }}
      >
        {cats === null && (
          <li
            style={{
              textAlign: "center",
              color: "#6b7280",
              border: "1px dashed #e5e7eb",
              borderRadius: 10,
              padding: 8,
            }}
          >
            Carregando…
          </li>
        )}

        {cats?.length === 0 && (
          <li
            style={{
              textAlign: "center",
              color: "#6b7280",
              border: "1px dashed #e5e7eb",
              borderRadius: 10,
              padding: 8,
            }}
          >
            Nenhuma categoria cadastrada.
          </li>
        )}

        {cats?.map((c) => (
          <li
            key={c.id}
            style={{
              display: "grid",
              gridTemplateColumns: "14px 1fr auto",
              alignItems: "center",
              gap: 10,
              background: "#fafafa",
              border: "1px solid #eef2f7",
              borderRadius: 10,
              padding: "8px 10px",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: c.color || "#60a5fa",
              }}
            />
            <span style={{ fontWeight: 600 }}>{c.name}</span>
            <button
              type="button"
              className="btn"
              style={{ background: "#ef4444", color: "#fff" }}
              onClick={() => onDel(c.id)}
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
