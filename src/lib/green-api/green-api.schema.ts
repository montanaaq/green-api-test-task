import type { Chat, GreenApiSettings, Message } from '../../types/index.ts'

import { isMessageTimestamp, isRecord } from '../utils/chat-input.ts'
import { getDeliveryError } from '../utils/messages.ts'

export const parseChatsResponse = (response: unknown): Chat[] => {
  if (!Array.isArray(response)) throw new Error('GREEN-API вернул неверный список чатов')

  const chats: Chat[] = []
  const items: unknown[] = response
  for (const item of items) {
    if (!isRecord(item) || typeof item.type !== 'string') {
      throw new Error('GREEN-API вернул неверные данные чата')
    }
    if (item.type !== 'user') continue

    const { chatId, name, phoneNumber } = item
    if (typeof chatId !== 'string' || !chatId || typeof name !== 'string') {
      throw new Error('GREEN-API вернул неверные данные чата')
    }
    const phone =
      typeof phoneNumber === 'number' && phoneNumber > 0 ? String(phoneNumber) : undefined
    chats.push({ chatId, name: name || phone || chatId, phoneNumber: phone })
  }
  return chats
}

export const parseAccountResponse = (response: unknown) => {
  if (!isRecord(response) || typeof response.exist !== 'boolean') {
    throw new Error('GREEN-API вернул неверный ответ проверки аккаунта')
  }
  if (!response.exist) throw new Error('Аккаунт MAX для этого номера не найден')
  if (typeof response.chatId !== 'string' || !response.chatId) {
    throw new Error('GREEN-API не вернул идентификатор чата MAX')
  }
  return response.chatId
}

export const parseHistoryResponse = (response: unknown, chatId: string): Message[] => {
  if (!Array.isArray(response)) throw new Error('GREEN-API вернул неверную историю чата')

  const messages: Message[] = []
  const items: unknown[] = response
  for (const item of items) {
    if (!isRecord(item) || typeof item.typeMessage !== 'string') {
      throw new Error('GREEN-API вернул неверные данные истории')
    }
    if (item.typeMessage !== 'textMessage' && item.typeMessage !== 'extendedTextMessage') continue

    const { textMessage, idMessage, timestamp, type, statusMessage } = item
    if (
      typeof textMessage !== 'string' ||
      typeof idMessage !== 'string' ||
      !idMessage ||
      !isMessageTimestamp(timestamp) ||
      (type !== 'incoming' && type !== 'outgoing')
    )
      throw new Error('GREEN-API вернул неверное текстовое сообщение в истории')

    messages.push({
      id: idMessage,
      chatId,
      text: textMessage,
      timestamp,
      direction: type,
      deliveryError: getDeliveryError(statusMessage)
    })
  }
  return messages.reverse()
}

export const parseSendResponse = (response: unknown) => {
  if (!isRecord(response) || typeof response.idMessage !== 'string' || !response.idMessage) {
    throw new Error('GREEN-API не подтвердил отправку сообщения')
  }
  return response.idMessage
}

export const parseSettingsResponse = (response: unknown): GreenApiSettings => {
  if (
    !isRecord(response) ||
    (response.incomingWebhook !== 'yes' && response.incomingWebhook !== 'no') ||
    (response.outgoingMessageWebhook !== 'yes' && response.outgoingMessageWebhook !== 'no') ||
    typeof response.webhookUrl !== 'string'
  )
    throw new Error('GREEN-API вернул неверные настройки инстанса')

  return {
    incomingWebhook: response.incomingWebhook,
    outgoingMessageWebhook: response.outgoingMessageWebhook,
    webhookUrl: response.webhookUrl
  }
}
