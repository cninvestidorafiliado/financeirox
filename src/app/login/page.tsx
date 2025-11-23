"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    signIn("google");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0fdf4",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "40px 30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          textAlign: "center",
          maxWidth: "380px",
          width: "100%",
        }}
      >
        <h1
          style={{
            marginBottom: "10px",
            fontSize: "26px",
            fontWeight: "800",
            color: "#065f46",
          }}
        >
          FinanceiroX
        </h1>

        <p style={{ marginBottom: "24px", color: "#374151", fontSize: "14px" }}>
          Faça login para acessar seu painel financeiro.
        </p>

        <button
          onClick={handleGoogleLogin}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            background: "#fff",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          <Image
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            width={24}
            height={24}
          />
          Entrar com Google
        </button>
      </div>
    </main>
  );
}
