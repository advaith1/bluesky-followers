import type { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs'

export type User = Pick<ProfileView, 'handle' | 'did' | 'avatar' | 'displayName'>

export { ProfileView }
