"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    try {
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={signIn}
      disabled={loading}
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        border: "1px solid #ccc",
        cursor: "pointer",
      }}
    >
      {loading ? "Entrando..." : "Entrar com Google"}
    </button>
  );
}
