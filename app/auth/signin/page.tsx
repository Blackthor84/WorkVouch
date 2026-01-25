"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

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
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) { 
        setErrorMsg(error.message); 
        setLoading(false);
        return; 
      }

      if (data.session && data.user) {
        // Fetch user roles to determine redirect
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        let userRoles: string[] = [];
        if (!rolesError && rolesData) {
          userRoles = rolesData.map((r: any) => r.role);
        }

        // Check user roles for redirect
        const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');
        const isEmployer = userRoles.includes('employer');
        
        // Redirect based on role:
        // 1. Admins → /admin
        // 2. Employers → /employer/dashboard
        // 3. Employees → /dashboard
        if (isAdmin) {
          router.push("/admin");
        } else if (isEmployer) {
          router.push("/employer/dashboard");
        } else {
          // Regular employees go to employee dashboard
          router.push("/dashboard");
        }
        
        // Force page refresh to ensure session is loaded
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
