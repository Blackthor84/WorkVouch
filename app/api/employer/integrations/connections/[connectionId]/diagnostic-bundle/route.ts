import { NextResponse } from "next/server";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";

type RouteParams = { params: Promise<{ connectionId: string }> };

/** GET /api/employer/integrations/connections/[connectionId]/diagnostic-bundle */
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const url = new URL(request.url);
  const preview = url.searchParams.get("preview") === "1" || url.searchParams.get("preview") === "true";
  const format = (url.searchParams.get("format") ?? "zip") as "json" | "zip" | "markdown";

  const buildOptions = {
    connectionId,
    employerAccountId: auth.ctx.employerAccountId,
    maxEvents: parseInt(url.searchParams.get("maxEvents") ?? "100", 10),
    maxLogs: parseInt(url.searchParams.get("maxLogs") ?? "200", 10),
  };

  try {
    if (preview) {
      const previewResult = await access.runtime.diagnosticBundles.previewDiagnosticBundle(buildOptions);
      return NextResponse.json(previewResult);
    }

    const exported = await access.runtime.diagnosticBundles.downloadDiagnosticBundle({
      ...buildOptions,
      format,
    });

    const body = typeof exported.data === "string" ? exported.data : new Uint8Array(exported.data);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": exported.contentType,
        "Content-Disposition": `attachment; filename="${exported.filename}"`,
        "Content-Length": String(exported.sizeBytes),
        "X-Bundle-Generated-At": exported.generatedAt,
        "X-Bundle-Size-Bytes": String(exported.sizeBytes),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate diagnostic bundle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
