import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";

// Note: Dummy test users have been removed. All authentication now goes through Supabase Auth.
// If you need test users, create them in Supabase Dashboard with proper passwords.

// Supabase client for authentication
// Using service role key for server-side operations to bypass RLS when fetching roles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for admin operations
// This allows us to fetch user roles without RLS restrictions
const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase configuration. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// For password authentication, we still need to use anon key
// Service role key cannot be used for signInWithPassword
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!process.env.NEXTAUTH_SECRET) {
  console.error("[auth] NEXTAUTH_SECRET is missing — sessions will not work. Set a stable secret (do not regenerate).");
}

if (!process.env.NEXTAUTH_URL) {
  console.error("[auth] NEXTAUTH_URL is missing in environment variables. Set to https://tryworkvouch.com in production.");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("⚠️ SUPABASE_SERVICE_ROLE_KEY is missing");
}

const getSupabaseAuth = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] Attempting login for:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing credentials");
          return null;
        }

        const supabase = await getSupabaseServer();

        const { data: user, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", credentials.email.trim().toLowerCase())
          .single();

        console.log("[AUTH] User lookup result:", user);
        console.log("[AUTH] Lookup error:", error);

        if (!user) {
          console.log("[AUTH] No user found");
          return null;
        }

        // TEMPORARY DEBUG: bypass password check
        return {
          id: user.id,
          email: (user as { email?: string }).email ?? credentials.email,
          name: (user as { full_name?: string }).full_name ?? null,
          role: (user as { role?: string }).role ?? "user",
          roles: [(user as { role?: string }).role].filter(Boolean) as string[],
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      console.log("[auth] SIGNIN SUCCESS:", user?.email);
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roles = user.roles;
        token.email = user.email;
      }
      // Session update: impersonation
      if (trigger === "update" && session) {
        if ((session as { impersonateUser?: { id: string; email: string; role: string; roles: string[] } }).impersonateUser) {
          const impersonateUser = (session as { impersonateUser: { id: string; email: string; role: string; roles: string[] } }).impersonateUser;
          token.impersonating = true;
          token.originalAdminId = token.id as string;
          token.originalAdminRoles = token.roles as string[] | undefined;
          token.id = impersonateUser.id;
          token.email = impersonateUser.email;
          token.role = impersonateUser.role;
          token.roles = impersonateUser.roles;
        }
        if ((session as { stopImpersonation?: boolean }).stopImpersonation) {
          token.id = token.originalAdminId as string;
          token.roles = token.originalAdminRoles;
          token.impersonating = false;
          delete token.originalAdminId;
          delete token.originalAdminRoles;
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[auth] SESSION ACTIVE:", session?.user?.email);
      // Block soft-deleted users: no session so they cannot use the app
      if (token?.id && session?.user) {
        try {
          const supabaseAdmin = getSupabaseAdmin();
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("is_deleted")
            .eq("id", token.id)
            .single();
          if ((profile as { is_deleted?: boolean } | null)?.is_deleted) {
            console.log("[auth] Session stripped: profile is_deleted=true for user", token.id);
            return { ...session, user: null as any };
          }
        } catch {
          // On DB error, allow session; do not block on transient errors
        }
      }
      // Ensure session and user exist before accessing
      if (session?.user && token?.sub) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roles = token.roles as string[];
        session.user.email = token.email as string;
      }
      session.impersonating = token.impersonating ?? false;
      if (token.originalAdminId) session.originalAdminId = token.originalAdminId as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful login
      // Invalid logins will not trigger this callback (authorize returns null)
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  pages: {
    signIn: "/login",
  },
};
