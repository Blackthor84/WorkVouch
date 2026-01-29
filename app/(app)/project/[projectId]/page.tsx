export default async function ProjectPage(props: any) {
  const { projectId } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;

  const data = await fetch(`https://api.workvouch.com/projects/${projectId}`)
    .then(res => res.json())
    .catch(() => ({ title: projectId, description: "No data found" }));

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
      {searchParams && <pre>{JSON.stringify(searchParams, null, 2)}</pre>}
    </div>
  );
}
