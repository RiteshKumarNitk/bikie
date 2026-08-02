import { PrismaClient } from "./generated/prisma/client.js";
import { createPrismaAdapter } from "./adapter";

const adapter = createPrismaAdapter(process.env.DATABASE_URL!);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
