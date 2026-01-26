import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Supabase client for authentication
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Dummy users with bcrypt hashed passwords (for testing/fallback)
// In production, store these in your database
const dummyUsers = [
  {
    id: "1",
    email: "nicoleanneaglin@gmail.com",
    password: "$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with actual bcrypt hash
    role: "admin",
  },
  {
    id: "2",
    email: "user@example.com",
    password: "$2a$10$YYYYYYYYYYYYYYYYYYYYYYYYYYYY", // Replace with actual bcrypt hash
    role: "user",
  },
];

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

        const email = credentials.email.trim();

        try {
          // Method 1: Try Supabase Auth first (for existing users)
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: credentials.password,
          });

          if (!error && data.user) {
            // Supabase Auth successful - fetch roles
            const supabaseAny = supabase as any;
            const { data: rolesData } = await supabaseAny
              .from("user_roles")
              .select("role")
              .eq("user_id", data.user.id);

            let userRoles: string[] = [];
            if (rolesData) {
              userRoles = rolesData.map((r: any) => r.role);
            }

            const isAdmin = userRoles.includes("admin") || userRoles.includes("superadmin");
            const isBeta = userRoles.includes("beta");
            // Determine primary role: beta takes precedence for access control
            const role = isBeta ? "beta" : (isAdmin ? "admin" : "user");

            return {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.full_name || data.user.email,
              role: role,
              roles: userRoles,
            };
          }

          // Method 2: Fallback to bcrypt verification (for dummy users or custom table)
          // Check dummy users array
          const dummyUser = dummyUsers.find((u) => u.email === email);
          if (dummyUser) {
            // Verify password with bcrypt
            const isValid = await bcrypt.compare(credentials.password, dummyUser.password);
            if (isValid) {
              return {
                id: dummyUser.id,
                email: dummyUser.email,
                name: dummyUser.email,
                role: dummyUser.role,
                roles: [dummyUser.role],
              };
            }
          }

          // Method 3: Check custom auth_users table in Supabase (if you create one)
          // Uncomment and customize if you want to use a custom table with bcrypt
          /*
          const supabaseAny = supabase as any;
          const { data: customUser } = await supabaseAny
            .from("auth_users")
            .select("id, email, password_hash, role")
            .eq("email", email)
            .single();

          if (customUser) {
            const isValid = await bcrypt.compare(credentials.password, customUser.password_hash);
            if (isValid) {
              return {
                id: customUser.id,
                email: customUser.email,
                name: customUser.email,
                role: customUser.role || "user",
                roles: [customUser.role || "user"],
              };
            }
          }
          */

          return null;
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
