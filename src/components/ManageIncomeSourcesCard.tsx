"use client";

import { useEffect, useState } from "react";

type NamedItem = {
  id: string;
  name: string;
  // Novos campos (opcionais, até a API devolver isso também)
  paymentWeekday?: number | null;
  workWeekStart?: number | null;
  workWeekEnd?: number | null;
  iconUrl?: string | null;
};

type Props = {
  compact?: boolean;
};

// Dias da semana (0..6)
const WEEK_DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

// Lista de empresas sugeridas
const COMPANY_PRESETS = [
  { value: "AMAZON_FLEX", label: "Amazon Flex" },
  { value: "AMAZON_HUB", label: "Amazon Hub" },
  { value: "UBER_EATS", label: "Uber Eats" },
  { value: "SAGAWA", label: "Sagawa" },
  { value: "YAMATO", label: "Yamato" },
  { value: "JAPAN_POST", label: "Japan Post" },
  { value: "OUTROS", label: "Outros" },
];

async function fetchSources() {
  const res = await fetch("/api/sources", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      "Erro ao carregar origens/categorias. Status: " + res.status
    );
  }
  return (await res.json()) as {
    incomeSources: NamedItem[];
    expenseCategories: NamedItem[];
  };
}

export default function ManageIncomeSourcesCard({ compact }: Props) {
  const [items, setItems] = useState<NamedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // seleção da empresa
  const [companyPreset, setCompanyPreset] = useState<string>("");
  const [customName, setCustomName] = useState("");

  // semana/pagamento
  const [paymentWeekday, setPaymentWeekday] = useState<number | "">("");
  const [workWeekStart, setWorkWeekStart] = useState<number | "">("");
  const [workWeekEnd, setWorkWeekEnd] = useState<number | "">("");

  // upload de ícone
  const [iconFile, setIconFile] = useState<File | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const data = await fetchSources();
      setItems(data.incomeSources || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setIconFile(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // 1) Nome da origem
    if (!companyPreset) {
      alert("Selecione uma origem de ganho.");
      return;
    }

    let finalName = "";
    if (companyPreset === "OUTROS") {
      if (!customName.trim()) {
        alert("Digite o nome da origem em 'Outros'.");
        return;
      }
      finalName = customName.trim();
    } else {
      const preset = COMPANY_PRESETS.find((c) => c.value === companyPreset);
      finalName = preset?.label ?? "";
    }

    if (!finalName) {
      alert("Nome da origem inválido.");
      return;
    }

    // 2) Semana/pagamento
    if (paymentWeekday === "" || workWeekStart === "" || workWeekEnd === "") {
      alert(
        "Selecione o dia do pagamento, o início e o fim da semana de trabalho."
      );
      return;
    }

    try {
      setSaving(true);

      // Usamos FormData para poder enviar o arquivo do ícone
      const formData = new FormData();
      formData.append("kind", "INCOME");
      formData.append("name", finalName);
      formData.append("paymentWeekday", String(paymentWeekday));
      formData.append("workWeekStart", String(workWeekStart));
      formData.append("workWeekEnd", String(workWeekEnd));

      if (iconFile) {
        formData.append("icon", iconFile);
      }

      const res = await fetch("/api/sources", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Erro ao salvar origem:", await res.text());
        alert("Não foi possível salvar a origem de ganho.");
        return;
      }

      // limpa formulário
      setCompanyPreset("");
      setCustomName("");
      setPaymentWeekday("");
      setWorkWeekStart("");
      setWorkWeekEnd("");
      setIconFile(null);

      // recarrega lista
      await reload();

      // avisa outras telas (ex.: transações, dashboard)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("finx:sources-changed"));
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão ao salvar origem.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir esta origem de ganho?")) return;
    try {
      const res = await fetch("/api/sources", {
        method: "DELETE",
        body: JSON.stringify({ kind: "INCOME", id }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        console.error("Erro ao excluir origem:", await res.text());
        alert("Não foi possível excluir a origem.");
        return;
      }
      await reload();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("finx:sources-changed"));
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão ao excluir origem.");
    }
  };

  const showCustomName = companyPreset === "OUTROS";

  return (
    <article className={`card ${compact ? "card-compact" : ""}`}>
      <h3>Origens de Ganho</h3>

      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {/* Seleção da empresa */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Selecione a origem
          </label>
          <select
            value={companyPreset}
            onChange={(e) => setCompanyPreset(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="">Selecione...</option>
            {COMPANY_PRESETS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nome customizado quando OUTROS */}
        {showCustomName && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Nome da origem (Outros)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex.: Bico sábado, Loja X, Cliente Y..."
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>
        )}

        {/* Dia do pagamento */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Dia do pagamento
          </label>
          <select
            value={paymentWeekday}
            onChange={(e) => setPaymentWeekday(Number(e.target.value))}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="">Selecione...</option>
            {WEEK_DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Início da semana de trabalho */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Início da semana de trabalho
          </label>
          <select
            value={workWeekStart}
            onChange={(e) => setWorkWeekStart(Number(e.target.value))}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="">Selecione...</option>
            {WEEK_DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fim da semana de trabalho */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Fim da semana de trabalho
          </label>
          <select
            value={workWeekEnd}
            onChange={(e) => setWorkWeekEnd(Number(e.target.value))}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="">Selecione...</option>
            {WEEK_DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Upload de ícone */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Ícone da empresa (opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ fontSize: 13 }}
          />
          {iconFile && (
            <small style={{ fontSize: 12, color: "#6b7280" }}>
              Arquivo selecionado: {iconFile.name}
            </small>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            alignSelf: "flex-end",
            minWidth: 120,
            borderRadius: 999,
            border: "none",
            background: "#22c55e",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            padding: "6px 16px",
            marginTop: 4,
          }}
        >
          {saving ? "Salvando..." : "Adicionar origem"}
        </button>
      </form>

      {/* Lista das origens cadastradas */}
      {loading ? (
        <p style={{ fontSize: 14, color: "#6b7280" }}>Carregando...</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          Nenhuma origem cadastrada ainda.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            fontSize: 14,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {items.map((it) => (
            <li
              key={it.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 8px",
                borderRadius: 10,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Ícone se existir */}
                {it.iconUrl ? (
                  <img
                    src={it.iconUrl}
                    alt={it.name}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#4b5563",
                    }}
                  >
                    {it.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <strong>{it.name}</strong>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {typeof it.paymentWeekday === "number" &&
                    typeof it.workWeekStart === "number" &&
                    typeof it.workWeekEnd === "number"
                      ? (() => {
                          const pay = WEEK_DAYS.find(
                            (d) => d.value === it.paymentWeekday
                          )?.label;
                          const start = WEEK_DAYS.find(
                            (d) => d.value === it.workWeekStart
                          )?.label;
                          const end = WEEK_DAYS.find(
                            (d) => d.value === it.workWeekEnd
                          )?.label;
                          return `Semana: ${start} até ${end} • Pagamento: ${pay}`;
                        })()
                      : "Configuração de semana/pagamento pendente"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDelete(it.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: 16,
                }}
                title="Excluir origem"
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
