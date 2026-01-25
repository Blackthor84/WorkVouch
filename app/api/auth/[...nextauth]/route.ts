import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

// Supabase client for authentication
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use Supabase Auth to verify credentials
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email.trim(),
            password: credentials.password,
          });

          if (error || !data.user) {
            console.error("Auth error:", error);
            return null;
          }

          // Fetch user roles from Supabase
          const supabaseAny = supabase as any;
          const { data: rolesData } = await supabaseAny
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id);

          let userRoles: string[] = [];
          if (rolesData) {
            userRoles = rolesData.map((r: any) => r.role);
          }

          // Determine role (admin or user)
          const isAdmin = userRoles.includes("admin") || userRoles.includes("superadmin");
          const role = isAdmin ? "admin" : "user";

          // Return user object for NextAuth session
          return {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name || data.user.email,
            role: role,
            roles: userRoles, // Store all roles for reference
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roles = user.roles;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roles = token.roles as string[];
        session.user.email = token.email as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects based on role
      // This will be handled in the signin page, but we can set defaults here
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },

  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
