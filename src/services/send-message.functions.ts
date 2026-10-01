import type { Message } from '@/types'

import { validateCredentialsInput, validateMessageInput } from '@/lib'
import { parseSendResponse } from '@/lib/green-api/green-api.schema'
import { createApi, invalidateHistory } from '@/lib/green-api/green-api.server'
import { createServerFn } from '@tanstack/react-start'

export const sendMessage = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    ...validateCredentialsInput(data),
    ...validateMessageInput(data)
  }))
  .handler(async ({ data }): Promise<Message> => {
    const api = createApi(data)
    const response = await api.post<unknown>('sendMessage', {
      chatId: data.chatId,
      message: data.message
    })
    const id = parseSendResponse(response.data)
    await invalidateHistory(data)
    return {
      id,
      chatId: data.chatId,
      text: data.message,
      timestamp: Math.floor(Date.now() / 1000),
      direction: 'outgoing'
    }
  })
