import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  debug: true, // logs extras no terminal

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Preenche o token JWT com os dados do Google
    async jwt({ token, account, profile }) {
      if (account && account.provider === "google") {
        if (profile?.email) {
          token.email = profile.email;
        }
        if ((profile as any)?.name) {
          token.name = (profile as any).name;
        }
      }
      return token;
    },

    // Copia os dados do token para a sessão (session.user)
    async session({ session, token }) {
      if (session.user) {
        if (token.email) {
          session.user.email = token.email as string;
        }
        if (token.name) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
