import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/src/**/*.test.ts", "packages/**/src/**/*.spec.ts"],
    environment: "node",
    globals: false,
  },
});
