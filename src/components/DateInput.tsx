"use client";

import { useEffect, useMemo, useState } from "react";
import { parseFlexibleDateToISO } from "@/lib/date";

type Props = {
  /** Valor sempre em ISO (YYYY-MM-DD) */
  value: string;
  /** Retorna sempre ISO (YYYY-MM-DD) */
  onChange: (iso: string) => void;
  /** Força usar o calendário nativo (padrão: true). Se false, usa máscara dd-mm-aaaa */
  useNative?: boolean;
  id?: string;
  style?: React.CSSProperties;
  min?: string; // ISO
  max?: string; // ISO
};

function supportsDateInput(): boolean {
  try {
    const i = document.createElement("input");
    i.setAttribute("type", "date");
    return i.type === "date";
  } catch {
    return false;
  }
}

export default function DateInput({
  value,
  onChange,
  useNative = true,
  id,
  style,
  min,
  max,
}: Props) {
  const canUseNative = typeof window !== "undefined" && supportsDateInput();
  const shouldUseNative = useNative && canUseNative;

  // --- MODO 1: Calendário nativo ---
  if (shouldUseNative) {
    return (
      <input
        id={id}
        type="date"
        value={value || ""}
        onChange={(e) => {
          const iso = e.target.value || value || "";
          if (iso) onChange(iso);
        }}
        min={min}
        max={max}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #ccc",
          ...style,
        }}
      />
    );
  }

  // --- MODO 2: Máscara dd-mm-aaaa (fallback) ---
  const display = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      return `${d}-${m}-${y}`;
    }
    return "";
  }, [value]);

  const [text, setText] = useState(display);
  useEffect(() => setText(display), [display]);

  const formatMask = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    if (digits.length <= 2) return dd;
    if (digits.length <= 4) return `${dd}-${mm}`;
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatMask(e.target.value);
    setText(masked);
    const iso = parseFlexibleDateToISO(masked);
    if (iso) onChange(iso);
  };

  const handleBlur = () => {
    const iso = parseFlexibleDateToISO(text);
    if (!iso) {
      setText(display);
      return;
    }
    onChange(iso);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="dd-mm-aaaa"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #ccc",
        ...style,
      }}
    />
  );
}
