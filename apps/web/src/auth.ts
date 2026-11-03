import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Kullanıcı", type: "text" },
        password: { label: "Şifre", type: "password" },
      },
      authorize: async (credentials) => {
        const u = process.env.AUTH_USERNAME || "admin";
        const p = process.env.AUTH_PASSWORD || "admin";
        if (credentials?.username === u && credentials?.password === p) {
          return { id: "1", name: u, email: `${u}@borsaweb.local` };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || "dev-secret-change-me",
});