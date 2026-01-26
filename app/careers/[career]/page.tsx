import { createClient } from '@supabase/supabase-js'

export default async function CareerPage(props: any) {
  const { career } = await props.params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('slug', career)
    .single()

  if (error) return <div>Error loading career: {error.message}</div>

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{data?.title}</h1>
      <p>{data?.description}</p>
    </div>
  )
}
