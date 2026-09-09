import { processVaultToPdf } from "./processVaultToPdf"
import { vaultFiles } from "./generated/bundle"

const handler = processVaultToPdf({ vaultFiles })

export default {
  async fetch(request: Request): Promise<Response> {
    return handler.handleRequest(request)
  },
}
