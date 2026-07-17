import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@bikie.app" }
  });
  console.log("User found:", user);
  
  if (user && user.role !== "ADMIN") {
    await prisma.user.update({
      where: { email: "admin@bikie.app" },
      data: { role: "ADMIN" }
    });
    console.log("Updated user role to ADMIN");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
