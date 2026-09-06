import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["processor/tests/**/*.test.ts", "worker/tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["processor/**/*.ts", "worker/**/*.ts"],
      exclude: ["worker/bundleVaultIntoWorker.ts", "worker/generateVault.ts", "worker/generated/**"],
    },
  },
})
