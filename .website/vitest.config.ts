import { defineConfig } from "vitest/config"
import { cloudflareTest } from "@cloudflare/vitest-plugin"

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          environment: "node",
          include: ["processor/tests/**/*.test.ts"],
          env: {
            VAULT_ROOT: "processor/tests/fixtures",
          },
        },
      },
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: "./worker/wrangler.jsonc" },
          }),
        ],
        test: {
          include: ["worker/tests/**/*.test.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["processor/**/*.ts", "worker/**/*.ts"],
      exclude: ["worker/bundleVaultIntoWorker.ts", "worker/generated/**"],
    },
  },
})
