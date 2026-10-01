import { validateCredentialsInput } from '@/lib'
import { parseSettingsResponse } from '@/lib/green-api/green-api.schema'
import { readApi } from '@/lib/green-api/green-api.server'
import { createServerFn } from '@tanstack/react-start'

export const getInstanceSettings = createServerFn({ method: 'POST' })
  .validator(validateCredentialsInput)
  .handler(async ({ data }) => {
    const response = await readApi(data, 'getSettings')
    return parseSettingsResponse(response)
  })
