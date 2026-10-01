import axios, { AxiosError, type AxiosAdapter } from 'axios'
import { afterEach, beforeEach, expect, it } from 'vitest'

import { apiReadClient, createApi, readApi, receiveApiNotification } from './green-api.server.ts'

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

const textNotification = {
  receiptId: 42,
  body: {
    typeWebhook: 'incomingMessageReceived',
    idMessage: 'message-1',
    timestamp: 1763115112,
    senderData: { chatId: '123' },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } }
  }
}
const credentials = { idInstance: '1', apiTokenInstance: 'test-token' }
const textFormats = [
  { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
  { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'Привет' } }
]
const messageWebhooks = [
  'incomingMessageReceived',
  'outgoingMessageReceived',
  'outgoingAPIMessageReceived'
]
messageWebhooks.forEach(typeWebhook => {
  textFormats.forEach(messageData => {
    it(`Should acknowledge ${typeWebhook} ${messageData.typeMessage} before returning it`, async () => {
      const methods: string[] = []
      axios.defaults.adapter = async config => {
        methods.push(`${config.method} ${config.url}`)
        const data =
          config.method === 'get'
            ? { ...textNotification, body: { ...textNotification.body, typeWebhook, messageData } }
            : { result: true }
        return { data, status: 200, statusText: 'OK', headers: {}, config }
      }
      await expect(receiveApiNotification(credentials)).resolves.toEqual({
        type: 'message',
        message: {
          id: 'message-1',
          chatId: '123',
          text: 'Привет',
          timestamp: 1763115112,
          direction: typeWebhook === 'incomingMessageReceived' ? 'incoming' : 'outgoing'
        }
      })
      expect(methods).toEqual([
        'get receiveNotification/test-token',
        'delete deleteNotification/test-token/42'
      ])
    })
  })
})
const failedStatuses = ['failed', 'noAccount', 'notInGroup']
failedStatuses.forEach(status => {
  it(`Should return the ${status} delivery error with its message and chat IDs`, async () => {
    axios.defaults.adapter = async config => {
      const data =
        config.method === 'get'
          ? {
              receiptId: 42,
              body: {
                typeWebhook: 'outgoingMessageStatus',
                idMessage: 'message-1',
                chatId: '123',
                status
              }
            }
          : { result: true }
      return { data, status: 200, statusText: 'OK', headers: {}, config }
    }
    const notification = await receiveApiNotification(credentials)
    expect(notification).toMatchObject({
      type: 'deliveryError',
      idMessage: 'message-1',
      chatId: '123'
    })
    expect(notification?.type === 'deliveryError' && notification.error).toEqual(expect.any(String))
  })
})

it('Should report an acknowledgement failure instead of returning an unconfirmed message', async () => {
  axios.defaults.adapter = async config => ({
    data: config.method === 'get' ? textNotification : { result: false },
    status: 200,
    statusText: 'OK',
    headers: {},
    config
  })
  await expect(receiveApiNotification(credentials)).rejects.toThrow(
    'Не удалось подтвердить получение уведомления'
  )
})
const malformedNotifications = [
  {
    ...textNotification,
    body: { ...textNotification.body, typeWebhook: 'outgoingMessageReceived', senderData: {} }
  },
  { ...textNotification, receiptId: '42' },
  { ...textNotification, body: { ...textNotification.body, timestamp: 'invalid' } },
  { ...textNotification, body: { ...textNotification.body, timestamp: 9e15 } },
  {
    ...textNotification,
    body: { ...textNotification.body, messageData: { typeMessage: 'textMessage' } }
  }
]
malformedNotifications.forEach(notification => {
  it('Should leave a malformed notification in the queue and report its invalid data', async () => {
    const methods: string[] = []
    axios.defaults.adapter = async config => {
      methods.push(config.method ?? '')
      return { data: notification, status: 200, statusText: 'OK', headers: {}, config }
    }
    await expect(receiveApiNotification(credentials)).rejects.toThrow('GREEN-API вернул неверное')
    expect(methods).toEqual(['get'])
  })
})

it('Should return no message for an empty notification queue without acknowledging it', async () => {
  const methods: string[] = []
  axios.defaults.adapter = async config => {
    methods.push(config.method ?? '')
    return { data: null, status: 200, statusText: 'OK', headers: {}, config }
  }
  await expect(receiveApiNotification(credentials)).resolves.toBeNull()
  expect(methods).toEqual(['get'])
})

it('Should acknowledge unsupported media without returning a text message', async () => {
  const methods: string[] = []
  axios.defaults.adapter = async config => {
    methods.push(config.method ?? '')
    const data =
      config.method === 'get'
        ? {
            ...textNotification,
            body: { ...textNotification.body, messageData: { typeMessage: 'imageMessage' } }
          }
        : { result: true }
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
  await expect(receiveApiNotification(credentials)).resolves.toBeNull()
  expect(methods).toEqual(['get', 'delete'])
})
