import { NextResponse } from "next/server";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";

/** POST /api/integrations/v1/webhooks/greenhouse — Greenhouse Hookshot webhook ingress */
export async function POST(request: Request) {
  const started = Date.now();
  try {
    const rawBody = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const url = new URL(request.url);
    const connectionId = url.searchParams.get("connectionId") ?? undefined;

    const runtime = getConnectApiRuntime();
    const result = await runtime.webhooks.receiveGreenhouse({
      rawBody,
      headers,
      connectionId,
    });

    return NextResponse.json(
      { ...result.body, latencyMs: Date.now() - started, metrics: runtime.webhookMetrics.getSnapshot() },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}
