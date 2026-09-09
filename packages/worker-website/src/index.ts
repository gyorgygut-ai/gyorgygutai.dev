import { processObsidianMdToHtml } from "@gyorgygutai/processor-md-to-html"
import { processHtmlToWebsite, siteCss, siteJs } from "@gyorgygutai/bitch-ass-shit"
import { vaultFiles, cssBundle, assetFiles } from "./generated/bundle"

const handler = processHtmlToWebsite(
  processObsidianMdToHtml,
  { vaultFiles, cssBundle, assetFiles },
  { siteCss, siteJs }
)

export default {
  async fetch(request: Request): Promise<Response> {
    return handler.handleRequest(request)
  },
}
