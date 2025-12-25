"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/FooterNav";
// ^^^ ajuste esse import pro caminho real da sua barra inferior

export default function BottomNavWrapper() {
  const pathname = usePathname();

  // Não mostra a barra na tela de login
  if (pathname === "/login") {
    return null;
  }

  // Se no futuro tiver outras páginas sem barra, é só adicionar aqui
  // if (pathname?.startsWith("/alguma-coisa")) return null;

  return <BottomNav />;
}
