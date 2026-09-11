import { processVaultToStatic, slugFor } from "./processVaultToStatic"
import { vaultFiles, assetFiles } from "./generated/bundle"

const handler = processVaultToStatic({ vaultFiles, assetFiles })

export { slugFor }

export default {
  async fetch(request: Request): Promise<Response> {
    return handler.handleRequest(request)
  },
}
