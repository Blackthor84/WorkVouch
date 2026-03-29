"use client";

/**
 * Development-only: surfaces profile fetch payload in the UI for debugging name/display issues.
 */
export function ProfileFetchDebug(props: {
  userId: string;
  profile: Record<string, unknown> | null;
  queryError: string | null;
}) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <details className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/40">
      <summary className="cursor-pointer font-medium text-amber-900 dark:text-amber-200">
        Dev: profile query debug
      </summary>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-amber-950 dark:text-amber-100">
        {JSON.stringify(
          {
            userId: props.userId,
            queryError: props.queryError,
            profile: props.profile,
          },
          null,
          2
        )}
      </pre>
    </details>
  );
}
