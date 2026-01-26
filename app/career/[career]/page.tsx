import React from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Correct type for dynamic routes in App Router
interface Params {
  career: string
}

interface CareerPageProps {
  params: Params
}

type Employee = {
  id: string
  name: string
  role: string
}

const CareerPage = async ({ params }: CareerPageProps) => {
  const { career } = params

  const { data: employees, error } = await supabase
    .from<Employee>("employees")
    .select("*")
    .eq("career", career)

  if (error) return <div>Error loading data: {error.message}</div>

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
