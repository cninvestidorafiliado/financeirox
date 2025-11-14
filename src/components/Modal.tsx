"use client";
import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e5e5",
          padding: 16,
        }}
      >
        {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
        <div style={{ display: "grid", gap: 12 }}>{children}</div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 8,
          }}
        >
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
