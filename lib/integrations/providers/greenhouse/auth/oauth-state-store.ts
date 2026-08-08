import type { OAuthStateStore, StoredOAuthState } from "../types";

const DEFAULT_TTL_MS = 15 * 60 * 1000;

/** In-memory OAuth state store for PKCE + CSRF (persisted in DB in Sprint 3B-2). */
export class InMemoryOAuthStateStore implements OAuthStateStore {
  private readonly states = new Map<string, StoredOAuthState>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  async saveState(state: StoredOAuthState): Promise<void> {
    this.states.set(state.state, { ...state });
  }

  async consumeState(state: string): Promise<StoredOAuthState | null> {
    const entry = this.states.get(state);
    if (!entry) return null;

    this.states.delete(state);

    if (new Date(entry.expiresAt).getTime() < Date.now()) {
      return null;
    }

    return entry;
  }

  async purgeExpired(): Promise<number> {
    const now = Date.now();
    let removed = 0;
    for (const [key, value] of this.states.entries()) {
      if (new Date(value.expiresAt).getTime() < now) {
        this.states.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  clear(): void {
    this.states.clear();
  }
}

export function createOAuthStateRecord(input: {
  state: string;
  employerAccountId: string;
  codeVerifier: string;
  redirectUri: string;
  ttlMs?: number;
}): StoredOAuthState {
  const createdAt = new Date();
  const ttl = input.ttlMs ?? DEFAULT_TTL_MS;
  return {
    state: input.state,
    employerAccountId: input.employerAccountId,
    codeVerifier: input.codeVerifier,
    redirectUri: input.redirectUri,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + ttl).toISOString(),
  };
}
