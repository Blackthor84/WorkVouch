"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { 
      setErrorMsg(error.message); 
      return; 
    }
    setErrorMsg("");
    window.location.href = "/dashboard";
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
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
