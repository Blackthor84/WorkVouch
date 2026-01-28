"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg("Invalid email or password");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Fetch session to get user role for redirect
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();

        // Redirect based on role
        if (session?.user?.role === "admin") {
          router.push("/admin");
        } else if (session?.user?.roles?.includes("employer")) {
          router.push("/employer/dashboard");
        } else {
          // All users go to dashboard after login
          router.push("/dashboard");
        }
        
        router.refresh();
      } else {
        setErrorMsg("Login failed. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
          className="w-full p-3 mb-3 border rounded" 
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          className="w-full p-3 mb-3 border rounded" 
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
