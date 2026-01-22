"use client"; // ensures this page runs on the client only

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Signed in successfully!");
      // Redirect to dashboard after successful sign in
      if (data.session) {
        window.location.href = "/dashboard";
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12 lg:py-16">
      <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
        </div>
        <form onSubmit={handleSignIn} className="flex flex-col gap-4 w-full">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded p-2"
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border rounded p-2"
          />
          <button type="submit" className="bg-blue-600 text-white rounded p-2">
            Sign In
          </button>
        </form>
        {message && <p className="text-center">{message}</p>}
      </div>
    </div>
  );
}
