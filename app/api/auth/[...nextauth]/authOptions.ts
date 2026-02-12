import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim();

        console.log("=== AUTH ATTEMPT START ===");
        console.log("Email:", email);
        console.log("Supabase URL exists:", !!supabaseUrl);
        console.log("Anon Key exists:", !!supabaseAnonKey);
        console.log("Service Role exists:", !!supabaseServiceRoleKey);

        try {
          // Step 1: Authenticate user with Supabase Auth (requires anon key)
          const supabaseAuth = getSupabaseAuth();
          const { data, error } = await supabaseAuth.auth.signInWithPassword({
            email: email,
            password: credentials.password,
          });

          if (error) {
            console.log("Supabase auth error:", error.message);
            throw new Error(error.message);
          }
          if (data?.user) {
            console.log("Supabase auth success:", data.user.id);
          }
          if (!data.user) {
            return null;
          }

          // Step 2: Fetch roles using service role key (bypasses RLS) — STRICT: fail loudly, no fallback
          console.log("=== ROLE QUERY START ===");
          console.log("User ID:", data.user.id);

          const supabaseAdmin = getSupabaseAdmin();

          const { data: rolesData, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("*")
            .eq("user_id", data.user.id);

          console.log("Raw rolesData:", rolesData);
          console.log("rolesError:", rolesError);

          if (rolesError) {
            console.log("❌ ROLE QUERY ERROR — DO NOT FALL BACK");
            throw new Error("Failed to fetch user roles in production");
          }

          if (!rolesData) {
            console.log("❌ rolesData is null — DO NOT FALL BACK");
            throw new Error("rolesData returned null");
          }

          let userRoles: string[] = rolesData.map((r: any) => r.role);

          if (userRoles.length === 0) {
            const { data: profileRow } = await supabaseAdmin
              .from("profiles")
              .select("role")
              .eq("id", data.user.id)
              .single();
            const profileRole = (profileRow as { role?: string } | null)?.role;
            if (profileRole) {
              userRoles = [profileRole];
              console.log("⚠️ No user_roles; using profile.role:", profileRole);
            } else {
              console.log("⚠️ No roles found for user in DB");
              throw new Error("Please complete role selection first.");
            }
          }

          console.log("Mapped userRoles:", userRoles);
          console.log("=== ROLE QUERY END ===");

          // Also check if user has employer role from employer_accounts
          const { data: employerAccount } = await supabaseAdmin
            .from("employer_accounts")
            .select("id")
            .eq("user_id", data.user.id)
            .single();

          if (employerAccount && !userRoles.includes("employer")) {
            userRoles.push("employer");
          }

          // Determine primary role: beta > admin > employer > user
          const isAdmin = userRoles.includes("admin") || userRoles.includes("superadmin");
          const isBeta = userRoles.includes("beta");
          const isEmployer = userRoles.includes("employer");
          
          const role = isBeta 
            ? "beta" 
            : isAdmin 
            ? "admin" 
            : isEmployer 
            ? "employer" 
            : "user";

          console.log("=== AUTH SUCCESS ===");

          return {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name || data.user.email,
            role: role,
            roles: userRoles,
          };
        } catch (error) {
          console.error("[auth] Login failed:", error instanceof Error ? error.message : error);
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

  secret: process.env.NEXTAUTH_SECRET,
};
