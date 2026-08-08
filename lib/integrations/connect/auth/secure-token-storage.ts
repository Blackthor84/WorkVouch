import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Provider-agnostic AES-256-GCM token encryption.
 * Uses ATS_ENCRYPTION_KEY (base64) when set; dev base64 fallback otherwise.
 */
export class ConnectSecureTokenStorage {
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
