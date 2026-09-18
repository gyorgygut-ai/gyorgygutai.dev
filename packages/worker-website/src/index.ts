import { processVaultToStatic, slugFor } from "./processVaultToStatic"
import { vaultFiles, assetFiles, cssBundle } from "./generated/bundle"

const handler = processVaultToStatic({ vaultFiles, assetFiles, cssBundle })

export { slugFor }

export default {
  async fetch(request: Request): Promise<Response> {
    return handler.handleRequest(request)
  },
}
