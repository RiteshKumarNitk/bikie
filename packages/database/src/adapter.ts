import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function useNeonAdapter(connectionString: string): boolean {
  if (process.env.DATABASE_ADAPTER === "neon") return true;
  if (process.env.DATABASE_ADAPTER === "pg") return false;
  return connectionString?.includes("neon.tech") ?? false;
}

export function createPrismaAdapter(connectionString: string) {
  if (useNeonAdapter(connectionString)) {
    return new PrismaNeon({ connectionString });
  }
  const pool = new Pool({ connectionString });
  return new PrismaPg(pool);
}
