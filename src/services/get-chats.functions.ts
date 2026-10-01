import { validateCredentialsInput } from '@/lib'
import { parseChatsResponse } from '@/lib/green-api/green-api.schema'
import { readApi } from '@/lib/green-api/green-api.server'
import { createServerFn } from '@tanstack/react-start'

export const getChats = createServerFn({ method: 'POST' })
  .validator(validateCredentialsInput)
  .handler(async ({ data }) => {
    const response = await readApi(data, 'getChats')
    return parseChatsResponse(response)
  })
