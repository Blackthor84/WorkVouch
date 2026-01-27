import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const authHandler = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials) return null;

        const { data } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        });

        if (!data.user) return null;

        return { 
          id: data.user.id, 
          email: data.user.email || "",
          name: data.user.email || "",
          role: "user"
        };
      },
    }),
  ],
  pages: { signIn: "/login" },
});

export { authHandler as GET, authHandler as POST };
