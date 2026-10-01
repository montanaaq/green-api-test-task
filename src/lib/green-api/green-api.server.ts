import type { GreenApiCredentials } from '../../types/green-api.types.ts'

import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { createHash } from 'node:crypto'

export const apiReadClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, gcTime: 60_000 } }
})
const cacheScope = (credentials: GreenApiCredentials) =>
  `${process.env.GREEN_API_URL}:${credentials.idInstance}:${createHash('sha256').update(credentials.apiTokenInstance).digest('hex')}`

export const readApi = <T>(
  credentials: GreenApiCredentials,
  method: 'getChats' | 'getChatHistory' | 'getSettings',
  data?: object
) => {
  const scope = cacheScope(credentials)
  return apiReadClient.query({
    queryKey: [method, scope, data],
    queryFn: async () => {
      const api = createApi(credentials)
      const response = data ? await api.post<T>(method, data) : await api.get<T>(method)
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
      throw new Error('GREEN-API не ответил вовремя. Проверьте адрес и доступ к сети.')
    }
    if (error.response) {
      throw new Error(
        `GREEN-API вернул ошибку ${error.response.status}. Проверьте инстанс и настройки.`
      )
    }
    throw new Error('Не удалось выполнить запрос к GREEN-API. Проверьте адрес и доступ к сети.')
  })

  return api
}
