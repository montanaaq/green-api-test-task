import type {
  Chat,
  GreenApiSettings,
  GreenApiAccount,
  GreenApiChat,
  GreenApiHistoryMessage,
  GreenApiNotification,
  Message
} from '@/types'

import {
  isRecord,
  validateCredentialsInput,
  validatePhoneInput,
  validateChatInput,
  validateMessageInput
} from '@/lib'
import { parseIncomingMessage } from '@/lib/green-api/green-api'
import {
  createGreenApi,
  invalidateGreenApiHistory,
  readGreenApi
} from '@/lib/green-api/green-api.server'
import { createServerFn } from '@tanstack/react-start'

export const getChats = createServerFn({ method: 'POST' })
  .validator(validateCredentialsInput)
  .handler(async ({ data }): Promise<Chat[]> => {
    const response = await readGreenApi<GreenApiChat[]>(data, 'getChats')
    return response
      .filter(chat => chat.type === 'user')
      .map(chat => ({
        chatId: chat.chatId,
        name: chat.name || String(chat.phoneNumber || chat.chatId),
        ...(chat.phoneNumber > 0 && { phoneNumber: String(chat.phoneNumber) })
      }))
  })

export const checkAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    ...validateCredentialsInput(data),
    ...validatePhoneInput(data)
  }))
  .handler(async ({ data }): Promise<Chat> => {
    const greenApi = createGreenApi(data)
    const { data: response } = await greenApi.post<GreenApiAccount>(
      'checkAccount',
      { phoneNumber: Number(data.phone) },
      { timeout: 30_000 }
    )
    return { chatId: response.chatId, name: `+${data.phone}`, phoneNumber: data.phone }
  })

export const getChatHistory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({ ...validateCredentialsInput(data), ...validateChatInput(data) }))
  .handler(async ({ data }): Promise<Message[]> => {
    const response = await readGreenApi<GreenApiHistoryMessage[]>(data, 'getChatHistory', {
      chatId: data.chatId,
      count: 50
    })
    return response
      .flatMap(item => {
        const isText =
          item.typeMessage === 'textMessage' || item.typeMessage === 'extendedTextMessage'
        if (!isText || typeof item.textMessage !== 'string') return []
        return [
          {
            id: item.idMessage,
            chatId: data.chatId,
            text: item.textMessage,
            timestamp: item.timestamp,
            direction: item.type
          }
        ]
      })
      .reverse()
  })

export const sendMessage = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    ...validateCredentialsInput(data),
    ...validateMessageInput(data)
  }))
  .handler(async ({ data }): Promise<Message> => {
    const greenApi = createGreenApi(data)
    const { data: response } = await greenApi.post<{ idMessage: string }>('sendMessage', {
      chatId: data.chatId,
      message: data.message
    })
    await invalidateGreenApiHistory(data)
    return {
      id: response.idMessage,
      chatId: data.chatId,
      text: data.message,
      timestamp: Math.floor(Date.now() / 1000),
      direction: 'outgoing'
    }
  })

export const receiveNotification = createServerFn({ method: 'POST' })
  .validator(validateCredentialsInput)
  .handler(async ({ data }): Promise<Message | null> => {
    const greenApi = createGreenApi(data)
    const { data: notification } = await greenApi.get<GreenApiNotification | null>(
      'receiveNotification'
    )
    if (notification === null) return null
    const message = parseIncomingMessage(notification)

    await greenApi.delete<{ result: boolean }>(`deleteNotification/${notification.receiptId}`)
    if (message) await invalidateGreenApiHistory(data)
    return message
  })

export const getInstanceSettings = createServerFn({ method: 'POST' })
  .validator(validateCredentialsInput)
  .handler(async ({ data }): Promise<GreenApiSettings> => {
    const settings = await readGreenApi<unknown>(data, 'getSettings')
    if (
      !isRecord(settings) ||
      !['yes', 'no'].includes(String(settings.incomingWebhook)) ||
      typeof settings.webhookUrl !== 'string'
    ) {
      throw new Error('GREEN-API вернул неверный формат настроек инстанса')
    }
    return {
      incomingWebhook: settings.incomingWebhook === 'yes' ? 'yes' : 'no',
      webhookUrl: settings.webhookUrl
    }
  })
