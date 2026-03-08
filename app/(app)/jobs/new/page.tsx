"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function AddJobPage() {
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");

  async function addJob() {
    const { data } = await supabase.auth.getUser();

    if (!data?.user) return;

    await supabase.from("jobs").insert({
      user_id: data.user.id,
      company_name: company,
      job_title: title,
      employment_type: "full_time",
      start_date: new Date().toISOString().split("T")[0],
      end_date: null,
      is_current: true,
    });

    alert("Job added!");
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Add Verified Job</h1>

      <input
        placeholder="Company Name"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="border p-2 mb-4 w-full"
      />

      <input
        placeholder="Job Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 mb-4 w-full"
      />

      <button
        onClick={addJob}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save Job
      </button>

      <p className="mt-4 text-sm text-gray-500">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
