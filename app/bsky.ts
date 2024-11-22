import { Agent } from '@atproto/api'
import { buildFetchHandler } from '@atproto/xrpc'

const url = 'https://public.api.bsky.app'

export const bsky = new Agent(url)

// @ts-expect-error the default fetchHandler adds an atproto-accept-labelers header
// which causes the browser to do a preflight request before every api request.
// looks like the only way to get rid of the header is to rebuild the fetchHandler.
bsky.fetchHandler = buildFetchHandler(url)
