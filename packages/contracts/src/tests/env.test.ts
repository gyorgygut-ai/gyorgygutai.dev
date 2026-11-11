import { afterEach, describe, expect, test } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { getCloudflareDeploymentEnv } from "../env"

const fixtureDir = join(import.meta.dirname, "fixtures", "env")
const originalEnv = { ...process.env }

function setup(name: string): void {
  process.env = {}
  const content = readFileSync(join(fixtureDir, name, ".env"), "utf8")
  Object.assign(process.env, Object.fromEntries(content.split(/\r?\n/)
    .map((line) => [line.indexOf("="), line] as const)
    .filter(([separator]) => separator > 0)
    .map(([separator, line]) => [line.slice(0, separator), line.slice(separator + 1)])))
}

afterEach(() => {
  process.env = { ...originalEnv }
})

describe("Cloudflare deployment contract", () => {
  test("parses the required deployment settings", () => {
    setup("valid")
    expect(getCloudflareDeploymentEnv()).toEqual({
      CLOUDFLARE_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
      CLOUDFLARE_API_TOKEN: "test-token",
      CLOUDFLARE_ZONE_NAME: "test.invalid",
    })
  })

  test("rejects a missing API token", () => {
    setup("missing-cf-api-token")
    expect(() => getCloudflareDeploymentEnv()).toThrow("CLOUDFLARE_API_TOKEN")
  })

  test("rejects an empty account ID", () => {
    setup("empty-cf-account-id")
    expect(() => getCloudflareDeploymentEnv()).toThrow("CLOUDFLARE_ACCOUNT_ID")
  })

  test("rejects a malformed account ID", () => {
    setup("invalid-cf-account-id")
    expect(() => getCloudflareDeploymentEnv()).toThrow("CLOUDFLARE_ACCOUNT_ID")
  })

  test("rejects a missing zone name", () => {
    setup("missing-cf-zone-name")
    expect(() => getCloudflareDeploymentEnv()).toThrow("CLOUDFLARE_ZONE_NAME")
  })

  test("rejects a malformed zone name", () => {
    setup("invalid-cf-zone-name")
    expect(() => getCloudflareDeploymentEnv()).toThrow("CLOUDFLARE_ZONE_NAME")
  })
})
