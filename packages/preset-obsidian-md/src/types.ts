export type VaultFiles = Record<string, string>
export type AssetFiles = Record<string, string>
export type AppearanceOrder = string[]

declare module "vfile" {
  interface DataMap {
    meta: Record<string, unknown>
    title?: string
  }
}
