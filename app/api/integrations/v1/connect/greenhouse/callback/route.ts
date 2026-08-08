import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";
import { createGreenhouseProvider } from "@/lib/integrations/providers/greenhouse/provider";
import { ConnectTokenStoreAdapter } from "@/lib/integrations/connect/auth/connect-token-store-adapter";
import { GREENHOUSE_MANIFEST } from "@/lib/integrations/providers/greenhouse/config/manifest";

/** GET /api/integrations/v1/connect/greenhouse/callback — OAuth callback for Greenhouse */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.json({ error: "code and state are required" }, { status: 400 });
    }

    const { data: oauthRow, error: oauthError } = await admin
      .from("connect_oauth_state")
      .select("*")
      .eq("state", state)
      .maybeSingle();

    if (oauthError || !oauthRow) {
      return NextResponse.json({ error: "Invalid or expired OAuth state" }, { status: 400 });
    }

    const runtime = getConnectApiRuntime();
    const tokenStore = new ConnectTokenStoreAdapter(runtime.connections);

    const provider = createGreenhouseProvider({
      tokenStore,
      stateStore: runtime.oauthStateAdapter,
      connectionManager: runtime.connections,
      harvestImport: runtime.harvestImport,
    });

    const result = await provider.connect({
      code,
      state,
      employerAccountId: oauthRow.employer_account_id,
      connectionId: oauthRow.connection_id,
      redirectUri: oauthRow.redirect_uri,
    });

    await runtime.connections.initializeCursor(result.connectionId, "greenhouse", GREENHOUSE_MANIFEST.version);

    const redirectBase = oauthRow.redirect_uri || "/settings/integrations";
    const redirectTarget = redirectBase.startsWith("http")
      ? new URL(redirectBase)
      : new URL(redirectBase, request.url);
    redirectTarget.searchParams.set("connected", "greenhouse");
    redirectTarget.searchParams.set("connectionId", result.connectionId);
    if (result.providerAccountName) {
      redirectTarget.searchParams.set("account", result.providerAccountName);
    }

    return NextResponse.redirect(redirectTarget);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "OAuth callback failed" },
      { status: 500 }
    );
  }
}
