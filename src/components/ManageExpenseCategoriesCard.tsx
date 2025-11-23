"use client";

import { useEffect, useState } from "react";

type NamedItem = {
  id: string;
  name: string;
};

async function fetchSources() {
  const res = await fetch("/api/sources", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao carregar origens/categorias");
  return (await res.json()) as {
    incomeSources: NamedItem[];
    expenseCategories: NamedItem[];
  };
}

export default function ManageExpenseCategoriesCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [items, setItems] = useState<NamedItem[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    try {
      setLoading(true);
      const data = await fetchSources();
      setItems(data.expenseCategories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    try {
      setSaving(true);
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "EXPENSE", name: name.trim() }),
      });
      if (!res.ok) {
        console.error("Erro ao salvar categoria:", await res.text());
        alert("Não foi possível salvar a categoria.");
        return;
      }
      setName("");
      await reload();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("finx:sources-changed"));
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão ao salvar categoria.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    try {
      const res = await fetch("/api/sources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "EXPENSE", id }),
      });
      if (!res.ok) {
        console.error("Erro ao excluir categoria:", await res.text());
        alert("Não foi possível excluir a categoria.");
        return;
      }
      await reload();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("finx:sources-changed"));
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão ao excluir categoria.");
    }
  };

  return (
    <article className={`card ${compact ? "card-compact" : ""}`}>
      <h3>Categorias de Gasto</h3>

      <form
        onSubmit={onSubmit}
        style={{ display: "flex", gap: 8, marginBottom: 8 }}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Alimentação, Transporte..."
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            minWidth: 42,
            borderRadius: 999,
            border: "none",
            background: "#f97316",
            color: "#fff",
            fontWeight: 700,
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          {saving ? "..." : "+"}
        </button>
      </form>

      {loading ? (
        <p style={{ fontSize: 14, color: "#6b7280" }}>Carregando...</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          Nenhuma categoria cadastrada ainda.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14 }}>
          {items.map((it) => (
            <li
              key={it.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 0",
                borderBottom: "1px dashed #e5e7eb",
              }}
            >
              <span>{it.name}</span>
              <button
                type="button"
                onClick={() => onDelete(it.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#ef4444",
                  cursor: "pointer",
                }}
                title="Excluir"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
