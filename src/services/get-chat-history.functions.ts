import { validateChatInput, validateCredentialsInput } from '@/lib'
import { parseHistoryResponse } from '@/lib/green-api/green-api.schema'
import { readApi } from '@/lib/green-api/green-api.server'
import { createServerFn } from '@tanstack/react-start'

export const getChatHistory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({ ...validateCredentialsInput(data), ...validateChatInput(data) }))
  .handler(async ({ data }) => {
    const response = await readApi(data, 'getChatHistory', { chatId: data.chatId, count: 50 })
    return parseHistoryResponse(response, data.chatId)
  })
