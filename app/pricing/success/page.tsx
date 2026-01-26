export default async function SuccessPage(props: any) {
  const searchParams = await props.searchParams;
  const session_id = searchParams?.session_id;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Payment Successful</h1>
      <p>Your upgrade was successful.</p>
      {session_id && <p>Session ID: {session_id}</p>}
    </div>
  );
}
