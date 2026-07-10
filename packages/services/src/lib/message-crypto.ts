import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const CURRENT_VERSION = 1;

// TS's "DOM" lib (required elsewhere in this monorepo) declares a fixed,
// non-generic `Uint8Array<ArrayBuffer>` that structurally conflicts with
// Node's `Buffer` (`Uint8Array<ArrayBufferLike>`), even though both are
// identical at runtime. `skipLibCheck` doesn't cover usage-site checks, so
// this narrow cast is the standard workaround for that lib collision.
function asBinary(buf: Buffer): NodeJS.ArrayBufferView {
  return buf as unknown as NodeJS.ArrayBufferView;
}

function getKey(): Buffer {
  const raw = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY is not set — required to encrypt/decrypt chat messages. See .env.example.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("MESSAGE_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256).");
  }
  return key;
}

export interface EncryptedMessageFields {
  ciphertext: string;
  iv: string;
  authTag: string;
  encryptionVersion: number;
}

export function encryptMessageContent(plaintext: string): EncryptedMessageFields {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, asBinary(getKey()), asBinary(iv));
  const ciphertext = Buffer.concat([
    new Uint8Array(cipher.update(plaintext, "utf8")),
    new Uint8Array(cipher.final()),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    encryptionVersion: CURRENT_VERSION,
  };
}

export function decryptMessageContent(row: {
  ciphertext: string;
  iv: string;
  authTag: string;
  encryptionVersion: number;
}): string {
  if (row.encryptionVersion !== CURRENT_VERSION) {
    throw new Error(`Unsupported message encryption version: ${row.encryptionVersion}`);
  }
  const decipher = createDecipheriv(ALGORITHM, asBinary(getKey()), asBinary(Buffer.from(row.iv, "base64")));
  decipher.setAuthTag(asBinary(Buffer.from(row.authTag, "base64")));
  const plaintext = Buffer.concat([
    new Uint8Array(decipher.update(asBinary(Buffer.from(row.ciphertext, "base64")))),
    new Uint8Array(decipher.final()),
  ]);
  return plaintext.toString("utf8");
}
