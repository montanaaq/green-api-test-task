import type { Chat, ChatNotification, Message } from '../../types/index.ts'

import { z } from 'zod'

import { getDeliveryError } from '../utils/messages.ts'
import { parseSchema } from '../utils/parse-schema.ts'

const idSchema = z.string().min(1)
const timestampSchema = z.number().int().min(0).max(8_640_000_000_000)
const itemsSchema = z.array(z.unknown())
const chatTypeSchema = z.looseObject({ type: z.string() })
const chatSchema = z.object({
  chatId: idSchema,
  name: z.string(),
  phoneNumber: z.unknown().optional()
})
const accountSchema = z.looseObject({ exist: z.boolean() })
const accountChatSchema = z.object({ chatId: idSchema })
const messageTypeSchema = z.looseObject({ typeMessage: z.string() })
const historyMessageSchema = z.object({
  textMessage: z.string(),
  idMessage: idSchema,
  timestamp: timestampSchema,
  type: z.enum(['incoming', 'outgoing']),
  statusMessage: z.unknown().optional()
})
const sendSchema = z.object({ idMessage: idSchema })
export const settingsSchema = z.object({
  incomingWebhook: z.enum(['yes', 'no']),
  outgoingMessageWebhook: z.enum(['yes', 'no']),
  webhookUrl: z.string()
})
const notificationSchema = z.object({
  receiptId: z.number().int().positive(),
  body: z.looseObject({ typeWebhook: z.string() })
})
const textDataSchema = z.discriminatedUnion('typeMessage', [
  z.object({
    typeMessage: z.literal('textMessage'),
    textMessageData: z.object({ textMessage: z.string() })
  }),
  z.object({
    typeMessage: z.literal('extendedTextMessage'),
    extendedTextMessageData: z.object({ text: z.string() })
  })
])
const textNotificationSchema = z.object({
  idMessage: idSchema,
  timestamp: timestampSchema,
  senderData: z.object({ chatId: idSchema }),
  messageData: textDataSchema
})
const statusSchema = z.object({ idMessage: idSchema, chatId: idSchema, status: z.string() })
const acknowledgementSchema = z.object({ result: z.literal(true) })

export const parseChatsResponse = (response: unknown): Chat[] => {
  const items = parseSchema(itemsSchema, response, 'Неверный список чатов')
  const chats: Chat[] = []
  for (const item of items) {
    const typed = parseSchema(chatTypeSchema, item, 'Неверные данные чата')
    if (typed.type !== 'user') continue
    const { chatId, name, phoneNumber } = parseSchema(chatSchema, typed, 'Неверные данные чата')
    const phone =
      typeof phoneNumber === 'number' && phoneNumber > 0 ? String(phoneNumber) : undefined
    chats.push({ chatId, name: name || phone || chatId, phoneNumber: phone })
  }
  return chats
}

export const parseAccountResponse = (response: unknown) => {
  const account = parseSchema(accountSchema, response, 'Неверный ответ проверки аккаунта')
  if (!account.exist) throw new Error('Аккаунт MAX для этого номера не найден')
  return parseSchema(accountChatSchema, account, 'Отсутствует идентификатор чата MAX').chatId
}

export const parseHistoryResponse = (response: unknown, chatId: string): Message[] => {
  const items = parseSchema(itemsSchema, response, 'Неверная история чата')
  const messages: Message[] = []
  for (const item of items) {
    const typed = parseSchema(messageTypeSchema, item, 'Неверные данные истории')
    if (typed.typeMessage !== 'textMessage' && typed.typeMessage !== 'extendedTextMessage') continue
    const message = parseSchema(
      historyMessageSchema,
      typed,
      'Неверное текстовое сообщение в истории'
    )
    messages.push({
      id: message.idMessage,
      chatId,
      text: message.textMessage,
      timestamp: message.timestamp,
      direction: message.type,
      deliveryError: getDeliveryError(message.statusMessage)
    })
  }
  return messages.reverse()
}

export const parseSendResponse = (response: unknown) =>
  parseSchema(sendSchema, response, 'Отправка сообщения не подтверждена').idMessage

export const parseSettingsResponse = (response: unknown) =>
  parseSchema(settingsSchema, response, 'Неверные настройки инстанса')

export const parseNotificationResponse = (response: unknown) => {
  const notification = parseSchema(notificationSchema, response, 'Неверное уведомление')
  const { body } = notification
  let result: ChatNotification | null = null
  if (
    body.typeWebhook === 'incomingMessageReceived' ||
    body.typeWebhook === 'outgoingMessageReceived' ||
    body.typeWebhook === 'outgoingAPIMessageReceived'
  ) {
    const details = parseSchema(messageTypeSchema, body.messageData, 'Неверные данные сообщения')
    if (details.typeMessage === 'textMessage' || details.typeMessage === 'extendedTextMessage') {
      const message = parseSchema(textNotificationSchema, body, 'Неверное текстовое уведомление')
      const text =
        message.messageData.typeMessage === 'textMessage'
          ? message.messageData.textMessageData.textMessage
          : message.messageData.extendedTextMessageData.text
      result = {
        type: 'message',
        message: {
          id: message.idMessage,
          chatId: message.senderData.chatId,
          text,
          timestamp: message.timestamp,
          direction: body.typeWebhook === 'incomingMessageReceived' ? 'incoming' : 'outgoing'
        }
      }
    }
  } else if (body.typeWebhook === 'outgoingMessageStatus') {
    const status = parseSchema(statusSchema, body, 'Неверный статус сообщения')
    const error = getDeliveryError(status.status)
    if (error)
      result = { type: 'deliveryError', chatId: status.chatId, idMessage: status.idMessage, error }
  }
  return { receiptId: notification.receiptId, result }
}

export const parseAcknowledgementResponse = (response: unknown) =>
  parseSchema(acknowledgementSchema, response, 'Не удалось подтвердить получение уведомления')
