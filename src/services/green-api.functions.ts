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
  validateCredentialsInput,
  validatePhoneInput,
  validateChatInput,
  validateMessageInput
} from '@/lib'
import { createApi, invalidateHistory, readApi } from '@/lib/green-api/green-api.server'
import { createServerFn } from '@tanstack/react-start'

export const getChats = createServerFn({ method: 'POST' })
  .validator(validateCredentialsInput)
  .handler(async ({ data }): Promise<Chat[]> => {
    const response = await readApi<GreenApiChat[]>(data, 'getChats')
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
    const api = createApi(data)
    const { data: response } = await api.post<GreenApiAccount>(
      'checkAccount',
      { phoneNumber: Number(data.phone) },
      { timeout: 30_000 }
    )
    if (!response.exist || !response.chatId)
      throw new Error('Аккаунт MAX для этого номера не найден')
    return { chatId: response.chatId, name: `+${data.phone}`, phoneNumber: data.phone }
  })

export const getChatHistory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({ ...validateCredentialsInput(data), ...validateChatInput(data) }))
  .handler(async ({ data }): Promise<Message[]> => {
    const response = await readApi<GreenApiHistoryMessage[]>(data, 'getChatHistory', {
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
    const api = createApi(data)
    const { data: response } = await api.post<{ idMessage: string }>('sendMessage', {
      chatId: data.chatId,
      message: data.message
    })
    if (!response.idMessage) throw new Error('GREEN-API не подтвердил отправку сообщения')
    await invalidateHistory(data)
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
    const api = createApi(data)
    const { data: notification } = await api.get<GreenApiNotification | null>('receiveNotification')
    if (!notification) return null
    const { body } = notification
    let message: Message | null = null
    if (body.typeWebhook === 'incomingMessageReceived') {
      const details = body.messageData
      if (
        details?.typeMessage === 'textMessage' ||
        details?.typeMessage === 'extendedTextMessage'
      ) {
        const text =
          details.typeMessage === 'textMessage'
            ? details.textMessageData?.textMessage
            : details.extendedTextMessageData?.text
        if (typeof text !== 'string' || !body.idMessage || !body.senderData?.chatId) {
          throw new Error('GREEN-API вернул неверное текстовое уведомление')
        }
        message = {
          id: body.idMessage,
          chatId: body.senderData.chatId,
          text,
          timestamp: body.timestamp,
          direction: 'incoming'
        }
      }
    }

    const { data: deleted } = await api.delete<{ result: boolean }>(
      `deleteNotification/${notification.receiptId}`
    )
    if (!deleted.result) throw new Error('Не удалось подтвердить получение уведомления')
    if (message) await invalidateHistory(data)
    return message
  })

export const getInstanceSettings = createServerFn({ method: 'POST' })
  .validator(validateCredentialsInput)
  .handler(async ({ data }): Promise<GreenApiSettings> => {
    return readApi<GreenApiSettings>(data, 'getSettings')
  })
