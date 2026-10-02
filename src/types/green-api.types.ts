import type { settingsSchema } from '../lib/green-api/green-api.schema'
import type { credentialsSchema } from '../lib/utils/chat-input'
import type { z } from 'zod'

export type GreenApiCredentials = z.infer<typeof credentialsSchema>
export type GreenApiSettings = z.infer<typeof settingsSchema>
