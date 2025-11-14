"use client";

import { useEffect, useState } from "react";
import { supabase, hasSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabase) return;

    // getUser com tipo explícito no callback
    supabase.auth.getUser().then((res: any) => {
      const user = res?.data?.user as { email?: string | null } | null;
      setEmail(user?.email ?? null);
    });

    // onAuthStateChange com tipos explícitos (_event e session)
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        const user = session?.user as { email?: string | null } | null;
        setEmail(user?.email ?? null);
      }
    );

    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    if (!hasSupabase) {
      alert("Backend não configurado (verifique .env.local)");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      console.error(error);
      alert("Erro ao entrar com Google");
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      alert("Erro ao sair");
    }
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Login</h1>

      {email ? (
        <>
          <p style={{ marginBottom: 12 }}>
            Logado como <b>{email}</b>
          </p>
          <button
            onClick={handleSignOut}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg, #f97316, #ef4444)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </>
      ) : (
        <>
          <p style={{ marginBottom: 12 }}>
            Entre com sua conta Google para sincronizar o FINANCEIROX entre
            computador e smartphone.
          </p>
          <button
            onClick={handleSignIn}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #0ea5e9)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Entrar com Google
          </button>
        </>
      )}

      <p style={{ marginTop: 18, fontSize: 13, color: "#64748b" }}>
        Depois de logar neste dispositivo e no celular, qualquer ganho/gasto
        adicionado em um deles aparecerá no outro automaticamente.
      </p>
    </div>
  );
}
