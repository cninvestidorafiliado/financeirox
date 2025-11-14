// src/lib/id.ts

// Tipagem segura mesmo quando a lib DOM não está toda disponível
const gcrypto = (globalThis as any)?.crypto as Crypto | undefined;

export function randomId(): string {
  // 1) Moderno
  if (gcrypto && typeof (gcrypto as any).randomUUID === "function") {
    return (gcrypto as any).randomUUID();
  }

  // 2) UUID v4 com getRandomValues (RFC 4122)
  if (gcrypto && typeof gcrypto.getRandomValues === "function") {
    const b = new Uint8Array(16);
    gcrypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant
    const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
      12,
      16
    )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // 3) Fallback simples (não-criptográfico)
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `tx_${ts}_${rnd}`;
}
