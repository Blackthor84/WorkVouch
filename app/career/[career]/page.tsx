import { createSupabaseServerClient } from '@/lib/supabase/server';

interface CareerPageProps {
  params: { career: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CareerPage({ params }: CareerPageProps) {
  const { career } = params;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('slug', career)
    .single();

  if (error || !data) return <p>Career not found</p>;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
    </div>
  );
}
