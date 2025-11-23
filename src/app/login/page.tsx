"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Se já estiver logado, manda para o dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

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

        {status === "loading" && (
          <p style={{ marginTop: "16px", fontSize: "13px", color: "#6b7280" }}>
            Verificando sessão...
          </p>
        )}
      </div>
    </main>
  );
}
