"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // STEP 3: aqui vamos criar o usuário no banco, mandar e-mail etc.
    alert("Cadastro ainda não está conectado ao backend. Próximo passo 😉");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#eef2ff",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: "32px 24px",
          boxShadow: "0 14px 30px rgba(15,23,42,0.18)",
          maxWidth: 380,
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
            textAlign: "center",
            color: "#1d4ed8",
          }}
        >
          Criar conta
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#4b5563",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Cadastre-se para começar a controlar seus ganhos e gastos.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            Nome
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                marginTop: 4,
                width: "100%",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                padding: "8px 10px",
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                marginTop: 4,
                width: "100%",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                padding: "8px 10px",
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            Senha
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                marginTop: 4,
                width: "100%",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                padding: "8px 10px",
                fontSize: 14,
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              marginTop: 10,
              width: "100%",
              borderRadius: 999,
              padding: "10px 14px",
              border: "none",
              background: "linear-gradient(90deg,#4f46e5,#6366f1)",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            Criar conta
          </button>
        </form>

        <p
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          Já tem cadastro?{" "}
          <Link href="/login" style={{ color: "#4f46e5", fontWeight: 600 }}>
            Fazer login
          </Link>
        </p>
      </div>
    </main>
  );
}
