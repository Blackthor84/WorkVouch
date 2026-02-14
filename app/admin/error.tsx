"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Admin panel error</h2>
      <pre>{error.message}</pre>
    </div>
  );
}
