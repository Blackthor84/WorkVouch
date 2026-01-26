import { createClient } from '@supabase/supabase-js'

// 1️⃣ Initialize Supabase client (server-side)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 2️⃣ Define the page function with the correct Next.js type
interface Params {
  career: string
}

interface Props {
  params: Params
}

const CareerPage = async ({ params }: Props) => {
  const { career } = params

  // 3️⃣ Fetch career data from Supabase
  const { data, error } = await supabase
    .from('careers')      // replace with your table name
    .select('*')
    .eq('slug', career)   // assumes 'slug' column matches URL
    .single()

  if (error) {
    return <div>Error loading career: {error.message}</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{data?.title || career}</h1>
      <p>{data?.description}</p>
    </div>
  )
}

export default CareerPage
