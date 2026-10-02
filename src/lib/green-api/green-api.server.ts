import type { ChatNotification } from '../../types/chat.types.ts'
import type { GreenApiCredentials } from '../../types/green-api.types.ts'

import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { createHash } from 'node:crypto'

import { parseAcknowledgementResponse, parseNotificationResponse } from './green-api.schema.ts'

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
  const { receiptId, result } = parseNotificationResponse(notification)
  const { data: deleted } = await api.delete<unknown>(`deleteNotification/${receiptId}`)
  parseAcknowledgementResponse(deleted)
  if (result) await invalidateHistory(credentials)
  return result
}
