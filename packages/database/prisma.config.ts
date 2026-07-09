import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: datasourceUrl,
  },
});
