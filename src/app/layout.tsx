"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (p: string) => (pathname === p ? "active" : "");

  return (
    // 👇 evita mismatch de atributos inseridos por extensões/navegador
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <main style={{ minHeight: "100svh", paddingBottom: 92 }}>
          {children}
        </main>

        {/* NAV INFERIOR */}
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

        <style jsx global>{`
          /* barra ocupa a largura toda, mas o conteúdo fica dentro do .fx-wrap */
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

          /* container centralizado com grid: esquerda | FAB | direita */
          .fx-wrap {
            max-width: 1040px; /* ajuste fino do “quão central” você quer */
            width: 100%;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 88px 1fr;
            align-items: center;
            gap: 8px;
          }

          .fx-side {
            display: flex;
            align-items: center;
            gap: 18px;
            justify-content: center; /* mantém os grupos perto do centro */
          }
          .fx-left {
            justify-content: flex-end;
          } /* puxa p/ perto do FAB */
          .fx-right {
            justify-content: flex-start;
          } /* idem do outro lado */

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
            pointer-events: none; /* não clica */
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
            margin: 0 auto; /* garante alinhamento na coluna central */
            margin-top: -36px; /* “sobe” o FAB sobre a barra */
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
