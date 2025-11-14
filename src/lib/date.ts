// src/lib/date.ts

// Já existia:
export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ✅ NOVO: aceita "dd/mm/aaaa", "dd-mm-aaaa" ou "aaaa-mm-dd" e devolve ISO (YYYY-MM-DD)
export function parseFlexibleDateToISO(input: string): string | null {
  if (!input) return null;
  const t = input.trim();

  // ISO já válido
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;

  // dd/mm/aaaa ou dd-mm-aaaa
  const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const dd = String(Number(m[1])).padStart(2, "0");
    const mm = String(Number(m[2])).padStart(2, "0");
    const yyyy = m[3];
    const iso = `${yyyy}-${mm}-${dd}`;
    // valida simples
    const d = new Date(iso);
    if (!isNaN(d.getTime()) && iso === ymd(d)) return iso;
    return null;
  }
  return null;
}

// ✅ NOVO: pega YYYY-MM da string ISO
export function isoYearMonth(iso: string): { y: number; m: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) };
}
