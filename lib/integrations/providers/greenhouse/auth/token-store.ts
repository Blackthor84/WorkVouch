import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { TokenPair } from "../../../types/common";
import type { SecureTokenStorage, StoredGreenhouseConnection, TokenStore } from "../types";

/** In-memory token store for Sprint 3B-1 (replaced by ats_connections in Sprint 3B-2). */
export class InMemoryTokenStore implements TokenStore {
  private readonly connections = new Map<string, StoredGreenhouseConnection>();

  async saveConnection(connection: StoredGreenhouseConnection): Promise<void> {
    this.connections.set(connection.connectionId, { ...connection });
  }

  async getConnection(connectionId: string): Promise<StoredGreenhouseConnection | null> {
    const connection = this.connections.get(connectionId);
    return connection ? { ...connection } : null;
  }

  async deleteConnection(connectionId: string): Promise<void> {
    this.connections.delete(connectionId);
  }

  async updateTokens(connectionId: string, tokens: TokenPair): Promise<void> {
    const existing = this.connections.get(connectionId);
    if (!existing) {
      throw new Error(`Connection ${connectionId} not found`);
    }
    this.connections.set(connectionId, {
      ...existing,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? existing.refreshToken,
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      updatedAt: new Date().toISOString(),
    });
  }

  clear(): void {
    this.connections.clear();
  }
}

/**
 * Encrypts tokens at rest using AES-256-GCM when ATS_ENCRYPTION_KEY is set.
 * Falls back to base64 encoding for local development only.
 */
export class AesSecureTokenStorage implements SecureTokenStorage {
  constructor(private readonly encryptionKey?: string) {}

  encrypt(plaintext: string): string {
    const key = this.encryptionKey ?? process.env.ATS_ENCRYPTION_KEY;
    if (!key) {
      return Buffer.from(plaintext, "utf8").toString("base64");
    }

    const keyBuffer = Buffer.from(key, "base64");
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, encrypted, tag]).toString("base64");
  }

  decrypt(ciphertext: string): string {
    const key = this.encryptionKey ?? process.env.ATS_ENCRYPTION_KEY;
    if (!key) {
      return Buffer.from(ciphertext, "base64").toString("utf8");
    }

    const keyBuffer = Buffer.from(key, "base64");
    const data = Buffer.from(ciphertext, "base64");
    const iv = data.subarray(0, 12);
    const tag = data.subarray(data.length - 16);
    const encrypted = data.subarray(12, data.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", keyBuffer, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }
}

export class EncryptedTokenStore implements TokenStore {
  constructor(
    private readonly inner: TokenStore,
    private readonly storage: SecureTokenStorage
  ) {}

  async saveConnection(connection: StoredGreenhouseConnection): Promise<void> {
    await this.inner.saveConnection({
      ...connection,
      accessToken: this.storage.encrypt(connection.accessToken),
      refreshToken: this.storage.encrypt(connection.refreshToken),
    });
  }

  async getConnection(connectionId: string): Promise<StoredGreenhouseConnection | null> {
    const connection = await this.inner.getConnection(connectionId);
    if (!connection) return null;
    return {
      ...connection,
      accessToken: this.storage.decrypt(connection.accessToken),
      refreshToken: this.storage.decrypt(connection.refreshToken),
    };
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await this.inner.deleteConnection(connectionId);
  }

  async updateTokens(connectionId: string, tokens: TokenPair): Promise<void> {
    const existing = await this.getConnection(connectionId);
    if (!existing) throw new Error(`Connection ${connectionId} not found`);
    await this.saveConnection({
      ...existing,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? existing.refreshToken,
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      updatedAt: new Date().toISOString(),
    });
  }
}
