import { createClient } from "@supabase/supabase-js"
import React from "react"

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Page props type
interface PageProps {
  params: {
    career: string
  }
}

// Async page component
const CareerPage = async ({ params }: PageProps) => {
  const { career } = params

  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .eq("career", career)

  if (error) return <div>Error fetching employees: {error.message}</div>

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Career: {career}</h1>
      {employees && employees.length ? (
        <ul>
          {employees.map(emp => (
            <li key={emp.id}>{emp.name} — {emp.role}</li>
          ))}
        </ul>
      ) : (
        <p>No employees found.</p>
      )}
    </div>
  )
}

export default CareerPage
