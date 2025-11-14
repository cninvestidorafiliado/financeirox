"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FooterNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="footer-nav no-print" aria-label="Navegação">
      <Link className={`footer-link ${isActive("/") ? "active" : ""}`} href="/">
        <span className="icon" aria-hidden>
          🏠
        </span>
        <span>Principal</span>
      </Link>
      <Link
        className={`footer-link ${isActive("/ganhos") ? "active" : ""}`}
        href="/ganhos"
      >
        <span className="icon" aria-hidden>
          💰
        </span>
        <span>Ganhos</span>
      </Link>
      <Link
        className={`footer-link ${isActive("/gastos") ? "active" : ""}`}
        href="/gastos"
      >
        <span className="icon" aria-hidden>
          💳
        </span>
        <span>Gastos</span>
      </Link>
      <Link
        className={`footer-link ${isActive("/relatorio") ? "active" : ""}`}
        href="/relatorio"
      >
        <span className="icon" aria-hidden>
          🖨️
        </span>
        <span>Relatório</span>
      </Link>
    </nav>
  );
}
