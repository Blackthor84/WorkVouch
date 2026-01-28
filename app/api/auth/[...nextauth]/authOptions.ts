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

        try {
          // Step 1: Authenticate user with Supabase Auth (requires anon key)
          const supabaseAuth = getSupabaseAuth();
          const { data, error } = await supabaseAuth.auth.signInWithPassword({
            email: email,
            password: credentials.password,
          });

          if (error || !data.user) {
            return null;
          }

          // Step 2: Fetch roles using service role key (bypasses RLS)
          const supabaseAdmin = getSupabaseAdmin();
          const { data: rolesData, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id);

          let userRoles: string[] = [];
          if (rolesData && !rolesError) {
            userRoles = rolesData.map((r: any) => r.role);
          }

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

          return {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name || data.user.email,
            role: role,
            roles: userRoles,
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
      // Ensure session and user exist before accessing
      if (session?.user && token?.sub) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roles = token.roles as string[];
        session.user.email = token.email as string;
      }
      // Always return session (required for NextAuth)
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
