import axios, { AxiosError, type AxiosAdapter } from 'axios'
import { afterEach, beforeEach, expect, it } from 'vitest'

import { apiReadClient, createApi, readApi } from './green-api.server.ts'

const originalAdapter = axios.defaults.adapter
const originalUrl = process.env.GREEN_API_URL
beforeEach(() => {
  process.env.GREEN_API_URL = 'https://green-api.example'
})

afterEach(() => {
  axios.defaults.adapter = originalAdapter
  apiReadClient.clear()
  if (originalUrl === undefined) delete process.env.GREEN_API_URL
  else process.env.GREEN_API_URL = originalUrl
})

it('Should keep instance credentials in each request path without mixing accounts', async () => {
  const urls: string[] = []
  const adapter: AxiosAdapter = async config => {
    urls.push(`${config.baseURL}/${config.url}`)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
  axios.defaults.adapter = adapter
  const first = createApi({ idInstance: '1', apiTokenInstance: 'one' })
  const second = createApi({ idInstance: '2', apiTokenInstance: 'two' })
  await Promise.all([first.get('getChats'), second.delete('deleteNotification/42')])
  expect(urls).toEqual([
    'https://green-api.example/waInstance1/getChats/one',
    'https://green-api.example/waInstance2/deleteNotification/two/42'
  ])
})

it('Should share a recent read only within the same instance credentials', async () => {
  let requests = 0
  axios.defaults.adapter = async config => {
    requests += 1
    return { data: [], status: 200, statusText: 'OK', headers: {}, config }
  }
  const credentials = { idInstance: '3', apiTokenInstance: 'one' }
  await Promise.all([readApi(credentials, 'getChats'), readApi(credentials, 'getChats')])
  await readApi(credentials, 'getChats')
  expect(requests).toBe(1)
  await readApi({ ...credentials, apiTokenInstance: 'two' }, 'getChats')
  expect(requests).toBe(2)
})

it('Should report an upstream error without exposing the instance token', async () => {
  axios.defaults.adapter = async config => {
    throw new AxiosError('secret-token', 'ERR_BAD_RESPONSE', config, undefined, {
      data: {},
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config
    })
  }
  const api = createApi({ idInstance: '5', apiTokenInstance: 'secret-token' })
  await expect(api.get('getChats')).rejects.toThrow('GREEN-API вернул ошибку 401')
  await expect(api.get('getChats')).rejects.not.toThrow('secret-token')
})
