/**
 * One-off Milestone 8 data migration: encrypts every existing plaintext `Message.content`
 * row into `ciphertext`/`iv`/`authTag`, verifies the round-trip decrypt matches the original
 * plaintext, then nulls `content`.
 *
 * NOT wired into `db:migrate` or any npm script — run manually, and only after explicit
 * user sign-off, since `DATABASE_URL` in this project points at the same database used by
 * both local dev and production (see .docs/DECISIONS.md ADR-011, and prior precedent for
 * raw data migrations on this project requiring explicit permission first).
 *
 * Usage (after sign-off): `dotenv -e ../../apps/web/.env.local -- tsx prisma/encrypt-existing-messages.ts`
 *
 * Uses the exact same algorithm/field layout as `packages/services/src/lib/message-crypto.ts`
 * (AES-256-GCM, MESSAGE_ENCRYPTION_KEY env, 12-byte IV, base64 fields), inlined here rather
 * than imported to avoid a packages/database -> packages/services reverse dependency for a
 * script that only runs once.
 */
import "dotenv/config";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_VERSION = 1;

function asBinary(buf: Buffer): NodeJS.ArrayBufferView {
  return buf as unknown as NodeJS.ArrayBufferView;
}

function getKey(): Buffer {
  const raw = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!raw) throw new Error("MESSAGE_ENCRYPTION_KEY is not set.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("MESSAGE_ENCRYPTION_KEY must decode to 32 bytes.");
  return key;
}

function encrypt(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, asBinary(getKey()), asBinary(iv));
  const ciphertext = Buffer.concat([new Uint8Array(cipher.update(plaintext, "utf8")), new Uint8Array(cipher.final())]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

function decrypt(row: { ciphertext: string; iv: string; authTag: string }): string {
  const decipher = createDecipheriv(ALGORITHM, asBinary(getKey()), asBinary(Buffer.from(row.iv, "base64")));
  decipher.setAuthTag(asBinary(Buffer.from(row.authTag, "base64")));
  const plaintext = Buffer.concat([
    new Uint8Array(decipher.update(asBinary(Buffer.from(row.ciphertext, "base64")))),
    new Uint8Array(decipher.final()),
  ]);
  return plaintext.toString("utf8");
}

async function run() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const plaintextRows = await prisma.message.findMany({
    where: { type: "TEXT", ciphertext: null, content: { not: null } },
    select: { id: true, content: true },
  });

  console.log(`Found ${plaintextRows.length} plaintext message(s) to encrypt.`);

  let migrated = 0;
  for (const row of plaintextRows) {
    const plaintext = row.content!;
    const encrypted = encrypt(plaintext);
    const roundTrip = decrypt(encrypted);
    if (roundTrip !== plaintext) {
      throw new Error(`Round-trip mismatch for message ${row.id} — aborting without writing.`);
    }

    await prisma.message.update({
      where: { id: row.id },
      data: {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        encryptionVersion: ENCRYPTION_VERSION,
        content: null,
      },
    });
    migrated += 1;
  }

  console.log(`Encrypted and verified ${migrated}/${plaintextRows.length} message(s).`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
