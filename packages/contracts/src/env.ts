import { z } from "zod"
import { EnvName } from "./names.js"

const CloudflareDeploymentSchema = z.object({
  [EnvName.CLOUDFLARE_ACCOUNT_ID]: z.string().regex(/^[a-f0-9]{32}$/i),
  [EnvName.CLOUDFLARE_API_TOKEN]: z.string().min(1),
  [EnvName.CLOUDFLARE_ZONE_NAME]: z
    .string()
    .regex(/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i),
})

export type CloudflareDeploymentEnv = z.infer<typeof CloudflareDeploymentSchema>

export function getCloudflareDeploymentEnv(): CloudflareDeploymentEnv {
  const parsed = CloudflareDeploymentSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")
    throw new Error(`Invalid deployment environment:\n${issues}`)
  }
  return parsed.data
}
