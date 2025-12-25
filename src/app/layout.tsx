import type { Metadata } from "next";

export const metadata: Metadata = {
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

("use client");

import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

// para testar rápido, pode usar: const INACTIVITY_LIMIT_MS = 60_000;

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (p: string) => (pathname === p ? "active" : "");

  // não mostra a barra inferior e o topo em login e signup
  const hideNav = pathname === "/login" || pathname === "/signup";

  const [userName, setUserName] = useState<string | null>(null);

  // Carrega nome do usuário logado (localStorage + /api/me se disponível)
  useEffect(() => {
    if (hideNav) return;
    let cancelled = false;

    // 1) tenta primeiro pelo localStorage (mais rápido)
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("fx_user_name");
        if (stored && !cancelled) {
          setUserName(stored);
        }
      } catch (err) {
        console.error("Erro ao ler fx_user_name do localStorage:", err);
      }
    }

    // 2) tenta sincronizar com backend (/api/me), se existir
    async function loadUserFromApi() {
      try {
        const res = await fetch("/api/me", { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.name) {
          setUserName(data.name as string);
          // atualiza localStorage para próximas visitas
          if (typeof window !== "undefined") {
            window.localStorage.setItem("fx_user_name", data.name);
            if (data.email) {
              window.localStorage.setItem(
                "fx_user_email",
                data.email as string
              );
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar usuário logado via /api/me:", err);
      }
    }

    loadUserFromApi();

    return () => {
      cancelled = true;
    };
  }, [hideNav]);

  // 🔥 Timer de inatividade: se passar 30min sem interação, faz logout automático
  useEffect(() => {
    if (hideNav) return; // não controla inatividade na tela de login/signup
    if (typeof window === "undefined") return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const logoutByInactivity = async () => {
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch (err) {
        console.error("Erro ao sair por inatividade:", err);
      }

      // limpa dados locais
      setUserName(null);
      try {
        window.localStorage.removeItem("fx_user_name");
        window.localStorage.removeItem("fx_user_email");
      } catch (err) {
        console.error("Erro ao limpar localStorage na inatividade:", err);
      }

      alert("Sua sessão expirou por inatividade. Faça login novamente.");
      router.push("/login");
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(logoutByInactivity, INACTIVITY_LIMIT_MS);
    };

    // eventos que contam como "atividade"
    const events = ["click", "mousemove", "keydown", "scroll", "touchstart"];

    events.forEach((evt) => {
      window.addEventListener(evt, resetTimer);
    });

    // inicia o timer na montagem
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((evt) => {
        window.removeEventListener(evt, resetTimer);
      });
    };
  }, [hideNav, router]);

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
      // limpa os dados mostrados no header
      setUserName(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("fx_user_name");
        window.localStorage.removeItem("fx_user_email");
      }
      router.push("/login");
    } catch (err) {
      console.error(err);
      alert("Erro ao sair. Tente novamente.");
    }
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        {/* TOPO: Bem-vindo + botão Sair */}
        {!hideNav && (
          <header className="fx-topbar">
            <div className="fx-topbar-inner">
              {/* Lado ESQUERDO – Bem-vindo + data */}
              <div className="fx-user-info">
                <span className="fx-welcome">
                  Bem-vindo, {userName ?? "Usuário"}!
                </span>
                <span className="fx-date">
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Lado DIREITO – Botão Sair */}
              <button className="fx-logout-btn" onClick={handleLogout}>
                <span className="fx-logout-icon">🚪</span>
                <span className="fx-logout-label">Sair</span>
              </button>
            </div>
          </header>
        )}

        {/* Casco global responsivo */}
        <main
          className="fx-main"
          style={{
            paddingBottom: hideNav
              ? 0
              : `calc(74px + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <div className="fx-page-shell">{children}</div>
        </main>

        {/* NAV INFERIOR — some em login/signup */}
        {!hideNav && (
          <nav className="fx-nav">
            {/* WRAPPER CENTRAL: limita a largura e centraliza o conteúdo */}
            <div className="fx-wrap">
              {/* lado esquerdo: Principal + Transações */}
              <div className="fx-side fx-left">
                <Link href="/" className={`fx-item ${isActive("/")}`}>
                  <span className="fx-emoji">🏠</span>
                  <span className="fx-label">Principal</span>
                </Link>

                <Link
                  href="/transacoes"
                  className={`fx-item ${isActive("/transacoes")}`}
                >
                  <span className="fx-emoji">📋</span>
                  <span className="fx-label">Transações</span>
                </Link>
              </div>

              {/* Botão + central */}
              <Link
                href="/cadastro"
                className={`fx-fab ${isActive("/cadastro")}`}
              >
                <span>＋</span>
              </Link>

              {/* lado direito: Relatório + Configurações (desativado) */}
              <div className="fx-side fx-right">
                <Link
                  href="/relatorio"
                  className={`fx-item ${isActive("/relatorio")}`}
                >
                  <span className="fx-emoji">📊</span>
                  <span className="fx-label">Relatório</span>
                </Link>

                {/* placeholder desativado para equilíbrio do layout */}
                <span className="fx-item fx-disabled" aria-disabled="true">
                  <span className="fx-emoji">⚙️</span>
                  <span className="fx-label">Configurações</span>
                </span>
              </div>
            </div>
          </nav>
        )}

        <style jsx global>{`
          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          *,
          *::before,
          *::after {
            box-sizing: border-box;
          }

          .fx-main {
            width: 100%;
          }

          .fx-page-shell {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 16px 12px 24px;
            overflow-x: hidden;
          }

          @media (min-width: 768px) {
            .fx-page-shell {
              max-width: 1040px;
              margin: 0 auto;
              padding: 24px;
            }
          }

          img,
          canvas,
          svg {
            max-width: 100%;
            height: auto;
          }

          .fx-topbar {
            width: 100%;
            position: sticky;
            top: 0;
            z-index: 900;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          }

          .fx-topbar-inner {
            max-width: 1040px;
            margin: 0 auto;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .fx-user-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .fx-welcome {
            font-weight: 600;
            font-size: 15px;
            color: #14532d;
          }

          .fx-date {
            font-size: 12px;
            color: #64748b;
            text-transform: capitalize;
          }

          .fx-logout-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 999px;
            border: 1px solid rgba(22, 163, 74, 0.25);
            background: #d1fae5;
            color: #065f46;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
            transition: transform 0.15s ease, box-shadow 0.15s ease,
              background 0.15s ease;
          }

          .fx-logout-icon {
            font-size: 16px;
          }

          .fx-logout-btn:hover {
            transform: translateY(-1px);
            background: #a7f3d0;
            box-shadow: 0 6px 16px rgba(34, 197, 94, 0.3);
          }

          .fx-logout-btn:active {
            transform: translateY(0);
            box-shadow: 0 3px 8px rgba(34, 197, 94, 0.25);
          }

          @media (max-width: 768px) {
            .fx-topbar-inner {
              padding: 10px 12px;
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }

            .fx-logout-btn {
              align-self: flex-end;
              padding: 6px 12px;
              font-size: 13px;
            }
          }

          .fx-nav {
            position: fixed;
            inset: auto 0 0 0;
            height: 74px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(12px);
            padding: 8px 14px;
            border-top: 1px solid rgba(0, 0, 0, 0.06);
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
            z-index: 1000;
          }

          .fx-wrap {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 6px;
            padding: 0 8px;
          }

          .fx-side {
            display: flex;
            align-items: center;
            gap: 18px;
            justify-content: center;
          }
          .fx-left {
            justify-content: flex-end;
          }
          .fx-right {
            justify-content: flex-start;
          }

          .fx-item {
            display: grid;
            place-items: center;
            gap: 4px;
            text-decoration: none;
            color: #334155;
            font: 600 13px/1.1 Inter, system-ui, sans-serif;
            transition: transform 0.15s ease, color 0.15s ease;
          }
          .fx-item .fx-emoji {
            font-size: 20px;
          }
          .fx-item.active,
          .fx-item:hover {
            color: #0ea5e9;
            transform: translateY(-2px);
          }

          .fx-disabled {
            opacity: 0.45;
            pointer-events: none;
            transform: none !important;
          }

          .fx-fab {
            --bg: linear-gradient(135deg, #22d3ee, #6366f1);
            width: 88px;
            height: 88px;
            display: grid;
            place-items: center;
            text-decoration: none;
            color: #fff;
            font: 800 36px/1 Inter, system-ui, sans-serif;
            background: var(--bg);
            border-radius: 999px;
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.35);
            border: 6px solid #fff;
            margin: 0 auto;
            margin-top: -36px;
            transition: transform 0.12s ease;
          }
          .fx-fab:active {
            transform: scale(0.97);
          }

          @media (max-width: 520px) {
            .fx-wrap {
              max-width: 92vw;
              grid-template-columns: 1fr 74px 1fr;
            }
            .fx-fab {
              width: 74px;
              height: 74px;
              font-size: 30px;
              margin-top: -28px;
            }
            .fx-label {
              font-size: 12px;
            }
            .fx-side {
              gap: 14px;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
