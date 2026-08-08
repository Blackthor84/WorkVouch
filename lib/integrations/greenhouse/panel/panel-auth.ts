import { SignJWT, jwtVerify } from "jose";
import type { PanelAuthContext } from "./types";

const PANEL_TOKEN_TTL_SECONDS = 15 * 60;

function getSecret(): Uint8Array {
  const secret = process.env.PANEL_JWT_SECRET ?? process.env.ATS_ENCRYPTION_KEY ?? "dev-panel-secret";
  return new TextEncoder().encode(secret);
}

/** Issue a short-lived panel token for Greenhouse iframe embedding. */
export async function signPanelToken(input: {
  connectionId: string;
  employerAccountId: string;
  externalCandidateId: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    connectionId: input.connectionId,
    employerAccountId: input.employerAccountId,
    externalCandidateId: input.externalCandidateId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + PANEL_TOKEN_TTL_SECONDS)
    .sign(getSecret());
}

/** Verify X-Panel-Token JWT for embedded panel requests. */
export async function verifyPanelToken(token: string): Promise<PanelAuthContext | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const connectionId = String(payload.connectionId ?? "");
    const employerAccountId = String(payload.employerAccountId ?? "");
    const externalCandidateId = String(payload.externalCandidateId ?? "");

    if (!connectionId || !employerAccountId || !externalCandidateId) return null;

    return {
      connectionId,
      employerAccountId,
      externalCandidateId,
      issuedAt: Number(payload.iat ?? 0),
      expiresAt: Number(payload.exp ?? 0),
    };
  } catch {
    return null;
  }
}

export { PANEL_TOKEN_TTL_SECONDS };
