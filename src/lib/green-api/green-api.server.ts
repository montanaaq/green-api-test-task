import type { ChatNotification } from '../../types/chat.types.ts'
import type { GreenApiCredentials } from '../../types/green-api.types.ts'

import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { createHash } from 'node:crypto'

import { isRecord, isMessageTimestamp } from '../utils/chat-input.ts'
import { getDeliveryError } from '../utils/messages.ts'

export const apiReadClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, gcTime: 60_000 } }
})
const cacheScope = (credentials: GreenApiCredentials) =>
  `${process.env.GREEN_API_URL}:${credentials.idInstance}:${createHash('sha256').update(credentials.apiTokenInstance).digest('hex')}`

export const readApi = (
  credentials: GreenApiCredentials,
  method: 'getChats' | 'getChatHistory' | 'getSettings',
  data?: object
) => {
  const scope = cacheScope(credentials)
  return apiReadClient.query({
    queryKey: [method, scope, data],
    queryFn: async () => {
      const api = createApi(credentials)
      const response = data ? await api.post<unknown>(method, data) : await api.get<unknown>(method)
      return response.data
    }
  })
}

export const invalidateHistory = (credentials: GreenApiCredentials) =>
  apiReadClient.invalidateQueries({ queryKey: ['getChatHistory', cacheScope(credentials)] })

export const createApi = (credentials: GreenApiCredentials) => {
  const api = axios.create({
    timeout: 15_000,
    responseType: 'json'
  })

  api.interceptors.request.use(config => {
    const base = process.env.GREEN_API_URL?.replace(/\/$/, '')
    const { idInstance: id, apiTokenInstance: token } = credentials
    if (!base) throw new Error('Заполните GREEN_API_URL в .env')
    const [method, ...suffix] = (config.url ?? '').split('/')
    config.baseURL = `${base}/waInstance${id}`
    config.url = `${method}/${token}${suffix.length ? `/${suffix.join('/')}` : ''}`
    return config
  })

  api.interceptors.response.use(undefined, (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Время ожидания ответа истекло. Проверьте адрес и доступ к сети.')
    }
    if (error.response) {
      throw new Error(`Ошибка ${error.response.status}. Проверьте инстанс и настройки.`)
    }
    throw new Error('Не удалось выполнить запрос. Проверьте адрес и доступ к сети.')
  })

  return api
}

export const receiveApiNotification = async (
  credentials: GreenApiCredentials
): Promise<ChatNotification | null> => {
  const api = createApi(credentials)
  const { data: notification } = await api.get<unknown>('receiveNotification')
  if (notification === null) return null
  if (
    !isRecord(notification) ||
    typeof notification.receiptId !== 'number' ||
    !Number.isSafeInteger(notification.receiptId) ||
    notification.receiptId <= 0 ||
    !isRecord(notification.body) ||
    typeof notification.body.typeWebhook !== 'string'
  ) {
    throw new Error('Неверное уведомление')
  }

  const { body } = notification
  let result: ChatNotification | null = null
  if (
    body.typeWebhook === 'incomingMessageReceived' ||
    body.typeWebhook === 'outgoingMessageReceived' ||
    body.typeWebhook === 'outgoingAPIMessageReceived'
  ) {
    if (!isRecord(body.messageData) || typeof body.messageData.typeMessage !== 'string') {
      throw new Error('Неверные данные сообщения')
    }
    const details = body.messageData
    if (details.typeMessage === 'textMessage' || details.typeMessage === 'extendedTextMessage') {
      const text =
        details.typeMessage === 'textMessage'
          ? isRecord(details.textMessageData) && details.textMessageData.textMessage
          : isRecord(details.extendedTextMessageData) && details.extendedTextMessageData.text
      if (
        typeof text !== 'string' ||
        typeof body.idMessage !== 'string' ||
        !body.idMessage ||
        !isRecord(body.senderData) ||
        typeof body.senderData.chatId !== 'string' ||
        !body.senderData.chatId ||
        !isMessageTimestamp(body.timestamp)
      ) {
        throw new Error('Неверное текстовое уведомление')
      }
      result = {
        type: 'message',
        message: {
          id: body.idMessage,
          chatId: body.senderData.chatId,
          text,
          timestamp: body.timestamp,
          direction: body.typeWebhook === 'incomingMessageReceived' ? 'incoming' : 'outgoing'
        }
      }
    }
  } else if (body.typeWebhook === 'outgoingMessageStatus') {
    if (
      typeof body.idMessage !== 'string' ||
      !body.idMessage ||
      typeof body.chatId !== 'string' ||
      !body.chatId ||
      typeof body.status !== 'string'
    ) {
      throw new Error('Неверный статус сообщения')
    }
    const error = getDeliveryError(body.status)
    if (error)
      result = { type: 'deliveryError', chatId: body.chatId, idMessage: body.idMessage, error }
  }

  const { data: deleted } = await api.delete<unknown>(
    `deleteNotification/${notification.receiptId}`
  )
  if (!isRecord(deleted) || deleted.result !== true) {
    throw new Error('Не удалось подтвердить получение уведомления')
  }
  if (result) await invalidateHistory(credentials)
  return result
}
