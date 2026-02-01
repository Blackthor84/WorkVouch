import { createServerSupabase } from "@/lib/supabase/server";

export default async function CareerPage(props: any) {
  const { career } = await props.params;

  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("careers")
    .select("*")
    .eq("slug", career)
    .single();

  if (error) return <div>Error loading career: {error.message}</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{(data as { title?: string; name?: string } | null)?.title ?? (data as { title?: string; name?: string } | null)?.name}</h1>
      <p>{(data as { description?: string | null } | null)?.description}</p>
    </div>
  );
}
