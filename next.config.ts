// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 🚫 Diz pra Vercel/Next NÃO travar o build por causa do ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // (opcional) você pode deixar o TypeScript falhar se tiver erro de tipo
  // se quiser ignorar erro de TS em produção também:
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;
