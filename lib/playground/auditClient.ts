/** Call from client to log playground actions (scenario saved, export, mass sim, threshold change). */
export async function logPlaygroundAudit(
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const res = await fetch("/api/playground/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, metadata }),
    });
    if (!res.ok) {
      console.warn("[playground/audit] non-ok", res.status);
    }
  } catch (e) {
    console.warn("[playground/audit]", e);
  }
}
