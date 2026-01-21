"use client"; // This ensures the page is client-side only

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Get environment variables at runtime
// Use NEXT_PUBLIC_ prefix for client-side access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.supabaseUrl;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.supabaseKey;

// Only create the client if both variables exist
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key are required at runtime");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Check your email for the login link!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Sign In</h1>
      <form onSubmit={handleSignIn} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded p-2"
        />
        <button type="submit" className="bg-blue-600 text-white rounded p-2">
          Send Magic Link
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
