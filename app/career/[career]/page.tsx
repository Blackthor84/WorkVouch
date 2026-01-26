// ✅ Import the auto-generated type EXACTLY how Vercel expects
import type { PageProps } from '../../../../../.next/types/app/careers/[career]/page'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function CareerPage(props: PageProps) {
  // ❗ params is a Promise — MUST await it
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
