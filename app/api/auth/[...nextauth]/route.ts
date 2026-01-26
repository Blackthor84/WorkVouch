import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google"; // example provider

// Your NextAuth config
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // ...any other options
};

// Create a route handler compatible with Next.js 16 App Router
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
