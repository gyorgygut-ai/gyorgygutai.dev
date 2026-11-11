export const EnvName = {
  CLOUDFLARE_ACCOUNT_ID: "CLOUDFLARE_ACCOUNT_ID",
  CLOUDFLARE_API_TOKEN: "CLOUDFLARE_API_TOKEN",
  CLOUDFLARE_ZONE_NAME: "CLOUDFLARE_ZONE_NAME",
} as const;

export type EnvName = typeof EnvName[keyof typeof EnvName];
