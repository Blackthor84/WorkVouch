import React from "react"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client using environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type for the dynamic route params
interface Params {
  career: string
}

// Props passed to the page component
interface CareerPageProps {
  params: Params
}

// Async page component to fetch data from Supabase
const CareerPage = async ({ params }: CareerPageProps) => {
  const { career } = params

  // Fetch employees matching the career from Supabase
  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .eq("career", career)

  if (error) {
    return <div>Error fetching employees: {error.message}</div>
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Career: {career}</h1>
      {employees && employees.length > 0 ? (
        <ul>
          {employees.map(emp => (
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
