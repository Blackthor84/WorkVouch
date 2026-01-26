import { createClient } from '@supabase/supabase-js'

// 1️⃣ Initialize Supabase client (server-side)
const supabase = createClient(
  process.env.SUPABASE_URL!,   // your Supabase URL from project settings
  process.env.SUPABASE_SERVICE_ROLE_KEY! // your secret service key
)

// 2️⃣ Define PageProps type for dynamic route
interface PageProps {
  params: { career: string }
}

// 3️⃣ Async page component
const CareerPage = async ({ params }: PageProps) => {
  const { career } = params

  // 4️⃣ Fetch career data from Supabase
  const { data, error } = await supabase
    .from('careers')          // replace with your table name
    .select('*')
    .eq('slug', career)       // assumes you have a 'slug' column matching the URL
    .single()

  if (error) {
    return <div>Error loading career: {error.message}</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Career: {career}</h1>
      {data ? (
        <div>
          <p><strong>Title:</strong> {data.title}</p>
          <p><strong>Description:</strong> {data.description}</p>
          {/* add more fields as needed */}
        </div>
      ) : (
        <p>No data found for this career.</p>
      )}
    </div>
  )
}

export default CareerPage
