import type { GreenApiCredentials } from '../../types/green-api.types.ts'
import type { AxiosResponse } from 'axios'

import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { createHash } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'

import { isRecord } from '../utils/chat-input.ts'

class RateLimitError extends Error {
  readonly retryAfter: number

  constructor(retryAfter: number) {
    super('GREEN-API: слишком частые запросы. Повторите попытку через несколько секунд.')
    this.retryAfter = retryAfter
  }
}

export const greenApiReadClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, gcTime: 60_000 } }
})
// ponytail: limits are enforced per server process; use shared storage if running multiple replicas.
const readSlots = new Map<string, Promise<number>>()

const cacheScope = (credentials: GreenApiCredentials) =>
  `${process.env.GREEN_API_URL}:${credentials.idInstance}:${createHash('sha256').update(credentials.apiTokenInstance).digest('hex')}`

export const readGreenApi = <T>(
  credentials: GreenApiCredentials,
  method: 'getChats' | 'getChatHistory' | 'getSettings',
  data?: object
) => {
  const scope = cacheScope(credentials)
  return greenApiReadClient.query({
    queryKey: [method, scope, data],
    queryFn: async () => {
      const slot = `${process.env.GREEN_API_URL}:${credentials.idInstance}:${method}`
      const previous = readSlots.get(slot) ?? Promise.resolve(0)
      const current = previous.then(async last => {
        await setTimeout(Math.max(0, last + 1_100 - Date.now()))
        return Date.now()
      })
      readSlots.set(slot, current)
      await current
      const greenApi = createGreenApi(credentials)
      const response = data ? await greenApi.post<T>(method, data) : await greenApi.get<T>(method)
      return response.data
    },
    retry: (count, error) => error instanceof RateLimitError && count < 2,
    retryDelay: (_, error) => (error instanceof RateLimitError ? error.retryAfter : 1_100)
  })
}

export const invalidateGreenApiHistory = (credentials: GreenApiCredentials) =>
  greenApiReadClient.invalidateQueries({ queryKey: ['getChatHistory', cacheScope(credentials)] })

export const createGreenApi = (credentials: { idInstance: string; apiTokenInstance: string }) => {
  const greenApi = axios.create({
    timeout: 15_000,
    responseType: 'json',
    transitional: { silentJSONParsing: false }
  })

  greenApi.interceptors.request.use(config => {
    const base = process.env.GREEN_API_URL?.replace(/\/$/, '')
    const { idInstance: id, apiTokenInstance: token } = credentials
    if (!base) throw new Error('Заполните GREEN_API_URL в .env')
    const [method, ...suffix] = (config.url ?? '').split('/')
    config.baseURL = `${base}/waInstance${id}`
    config.url = `${method}/${token}${suffix.length ? `/${suffix.join('/')}` : ''}`
    return config
  })

  greenApi.interceptors.response.use(
    (response: AxiosResponse<unknown>) => {
      const method = response.config.url?.split('/')[0]
      const data = response.data
      if (method === 'receiveNotification') {
        if (data === '' || data === null) {
          response.data = null
          return response
        }
        if (
          !isRecord(data) ||
          typeof data.receiptId !== 'number' ||
          !Number.isSafeInteger(data.receiptId) ||
          data.receiptId <= 0 ||
          !isRecord(data.body) ||
          typeof data.body.typeWebhook !== 'string'
        ) {
          throw new Error('GREEN-API вернул неверный формат входящего уведомления')
        }
      }
      if (isRecord(data) && data.status === false) {
        const reason = typeof data.reason === 'string' ? data.reason : 'Неизвестная ошибка'
        throw new Error(`GREEN-API: ${reason}`)
      }
      if (
        method === 'checkAccount' &&
        (!isRecord(data) || data.exist !== true || typeof data.chatId !== 'string' || !data.chatId)
      ) {
        throw new Error('Аккаунт MAX для этого номера не найден')
      }
      if (
        method === 'sendMessage' &&
        (!isRecord(data) || typeof data.idMessage !== 'string' || !data.idMessage)
      ) {
        throw new Error('GREEN-API не подтвердил отправку сообщения')
      }
      if (method === 'deleteNotification' && (!isRecord(data) || data.result !== true)) {
        throw new Error('Не удалось подтвердить получение уведомления')
      }
      return response
    },
    (error: unknown) => {
      if (!axios.isAxiosError(error)) throw error
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('GREEN-API не ответил вовремя. Проверьте адрес и доступ к сети.')
      }
      if (error.response) {
        if (error.response.status === 429) {
          const header = error.response.headers['retry-after']
          const seconds = typeof header === 'string' ? Number(header) : NaN
          const retryAfter = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1_000 : 2_000
          throw new RateLimitError(Math.max(1_100, retryAfter))
        }
        if (error.response.status >= 200 && error.response.status < 300) {
          throw new Error('GREEN-API вернул неверный JSON в ответе.')
        }
        throw new Error(
          `GREEN-API вернул ошибку ${error.response.status}. Проверьте инстанс и настройки.`
        )
      }
      throw new Error('Не удалось выполнить запрос к GREEN-API. Проверьте адрес и доступ к сети.')
    }
  )

  return greenApi
}
