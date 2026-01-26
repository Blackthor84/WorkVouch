interface ProjectPageProps {
  params: { projectId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const { projectId } = params;

  const data = await fetch(`https://api.workvouch.com/projects/${projectId}`)
    .then(res => res.json())
    .catch(() => ({ title: projectId, description: 'No data found' }));

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
      {searchParams && <pre>{JSON.stringify(searchParams, null, 2)}</pre>}
    </div>
  );
}
