import { defineConfig } from "vitest/config"
import { cloudflareTest } from "@cloudflare/vitest-plugin"

export default defineConfig({
  test: {
    globals: true,
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./src/wrangler.jsonc" },
      }),
    ],
    include: ["src/tests/**/*.test.ts"],
  },
})