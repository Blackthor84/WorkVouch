// ✅ MUST import the generated PageProps so your types match Vercel's build output
import type { PageProps } from '../../../../.next/types/app/career/[career]/page'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Next.js gives you params as a Promise, so you MUST await it.
export default async function CareerPage(props: PageProps) {
  const { career } = await props.params

  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('slug', career)
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
