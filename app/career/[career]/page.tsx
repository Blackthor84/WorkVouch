import React from "react"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase (use your env variables)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type CareerPageProps = {
  params: { career: string }
}

type Employee = {
  id: string
  name: string
  role: string
  // add other fields from your database
}

const CareerPage = async ({ params }: CareerPageProps) => {
  const { career } = params

  // Fetch employees for this career
  const { data: employees, error } = await supabase
    .from<Employee>("employees") // replace "employees" with your table name
    .select("*")
    .eq("career", career)

  if (error) {
    return <div>Error loading data: {error.message}</div>
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>
        Career: {career}
      </h1>

      {employees && employees.length > 0 ? (
        <ul>
          {employees.map((emp) => (
            <li key={emp.id}>
              {emp.name} — {emp.role}
            </li>
          ))}
        </ul>
      ) : (
        <p>No employees found for this career.</p>
      )}
    </div>
  )
}

export default CareerPage
