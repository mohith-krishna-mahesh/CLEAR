import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "../../config/env";

function masterKey(): Buffer {
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be 32-byte hex (64 chars) for AES-256-GCM",
    );
  }
  return key;
}

export function encryptPrivateKey(plaintext: string): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext: ciphertext.toString("hex"),
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

export function decryptPrivateKey(parts: {
  ciphertext: string;
  iv: string;
  authTag: string;
}): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    masterKey(),
    Buffer.from(parts.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(parts.authTag, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(parts.ciphertext, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
