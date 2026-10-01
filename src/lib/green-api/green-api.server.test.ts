import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { inspect } from 'node:util'

import { createGreenApi, greenApiReadClient, readGreenApi } from './green-api.server.ts'

test('GREEN-API HTTP contract', async t => {
  const previous = {
    url: process.env.GREEN_API_URL,
    id: process.env.GREEN_API_ID_INSTANCE,
    token: process.env.GREEN_API_TOKEN_INSTANCE
  }
  let chatReads = 0
  let rateAttempts = 0
  const server = createServer(async (request, response) => {
    if (request.url?.includes('/timeout/')) return
    response.setHeader('Content-Type', 'application/json')
    if (request.url?.includes('/failure/')) {
      response.writeHead(401).end('{"error":"unauthorized"}')
      return
    }
    if (request.url?.includes('/invalid/')) {
      response.end('invalid JSON')
      return
    }
    if (request.url?.includes('/receiveNotification/')) {
      const variant = request.url.split('/').at(-1)
      if (variant === 'empty') response.end()
      else if (variant === 'missing') response.end('{}')
      else if (variant === 'noBody') response.end('{"receiptId":1}')
      else if (variant === 'nullBody') response.end('{"receiptId":1,"body":null}')
      else if (variant === 'invalidReceipt')
        response.end('{"receiptId":0,"body":{"typeWebhook":"stateInstanceChanged"}}')
      else if (variant === 'noWebhook') response.end('{"receiptId":1,"body":{}}')
      else if (variant === 'noReceipt')
        response.end('{"body":{"typeWebhook":"stateInstanceChanged"}}')
      else if (variant === 'valid') {
        response.end('{"receiptId":1,"body":{"typeWebhook":"stateInstanceChanged"}}')
      } else response.end('null')
      return
    }
    if (request.url?.includes('/unknownBusinessError')) {
      response.end('{"status":false}')
      return
    }
    if (request.url?.includes('/businessError')) {
      response.end('{"status":false,"reason":"Account unavailable"}')
      return
    }
    if (request.url?.endsWith('/missing')) {
      response.end('{}')
      return
    }
    if (request.url?.includes('/checkAccount/') && !request.url.endsWith('/echo')) {
      response.end('{"exist":true,"chatId":"123","fromCache":false}')
      return
    }
    if (request.url?.includes('/getChats/')) {
      chatReads += 1
      if (request.url.includes('/rate-token') && ++rateAttempts === 1) {
        response.writeHead(429, { 'Retry-After': '1' }).end('{}')
        return
      }
      response.end('[{"chatId":"123","name":"Иван","type":"user","phoneNumber":79991234567}]')
      return
    }
    let body = ''
    for await (const chunk of request) body += chunk
    response.end(
      JSON.stringify({
        url: request.url,
        method: request.method,
        contentType: request.headers['content-type'],
        body,
        ...(request.url?.includes('/checkAccount/') && {
          exist: true,
          chatId: '123',
          fromCache: false
        }),
        ...(request.url?.includes('/sendMessage/') && { idMessage: 'message-1' }),
        ...(request.url?.includes('/deleteNotification/') && { result: true })
      })
    )
  })
  t.after(() => {
    greenApiReadClient.clear()
    server.closeAllConnections()
    server.close()
    if (previous.url === undefined) delete process.env.GREEN_API_URL
    else process.env.GREEN_API_URL = previous.url
    if (previous.id === undefined) delete process.env.GREEN_API_ID_INSTANCE
    else process.env.GREEN_API_ID_INSTANCE = previous.id
    if (previous.token === undefined) delete process.env.GREEN_API_TOKEN_INSTANCE
    else process.env.GREEN_API_TOKEN_INSTANCE = previous.token
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  process.env.GREEN_API_URL = `http://127.0.0.1:${address.port}/`
  process.env.GREEN_API_ID_INSTANCE = '1'
  process.env.GREEN_API_TOKEN_INSTANCE = 'env-token-must-not-be-used'
  const greenApi = createGreenApi({ idInstance: '1', apiTokenInstance: 'secret-token' })

  interface Echo {
    url: string
    method: string
    contentType?: string
    body: string
  }
  await t.test('Should return the available chats', async () => {
    const { data } = await greenApi.get('getChats')
    assert.deepEqual(data, [
      { chatId: '123', name: 'Иван', type: 'user', phoneNumber: 79991234567 }
    ])
  })

  await t.test('Should share and cache repeated chat reads without mixing credentials', async () => {
    const credentials = { idInstance: '1', apiTokenInstance: 'secret-token' }
    const before = chatReads
    const [first, second] = await Promise.all([
      readGreenApi(credentials, 'getChats'),
      readGreenApi(credentials, 'getChats')
    ])
    assert.deepEqual(first, second)
    assert.deepEqual(await readGreenApi(credentials, 'getChats'), first)
    assert.equal(chatReads, before + 1)

    await readGreenApi({ ...credentials, apiTokenInstance: 'another-token' }, 'getChats')
    assert.equal(chatReads, before + 2)
  })

  await t.test('Should retry a rate-limited read after Retry-After', async () => {
    const data = await readGreenApi(
      { idInstance: '1', apiTokenInstance: 'rate-token' },
      'getChats'
    )
    assert.ok(Array.isArray(data))
    assert.equal(rateAttempts, 2)
  })

  await t.test('Should send the recipient phone as a JSON number', async () => {
    const { data } = await greenApi.post<Echo>('checkAccount/echo', { phoneNumber: 79991234567 })
    assert.equal(data.url, '/waInstance1/checkAccount/secret-token/echo')
    assert.equal(data.method, 'POST')
    assert.equal(data.contentType, 'application/json')
    assert.deepEqual(JSON.parse(data.body), { phoneNumber: 79991234567 })
  })

  await t.test('Should return the resolved MAX account', async () => {
    assert.deepEqual((await greenApi.post('checkAccount', { phoneNumber: 79991234567 })).data, {
      exist: true,
      chatId: '123',
      fromCache: false
    })
  })

  await t.test('Should send the chat ID and text and return the message confirmation', async () => {
    const { data } = await greenApi.post<Echo>('sendMessage', { chatId: '123', message: 'Привет' })
    assert.deepEqual(data, {
      url: '/waInstance1/sendMessage/secret-token',
      method: 'POST',
      contentType: 'application/json',
      body: '{"chatId":"123","message":"Привет"}',
      idMessage: 'message-1'
    })
  })

  await t.test(
    'Should request history for the selected chat with the requested limit',
    async () => {
      const { data } = await greenApi.post<Echo>('getChatHistory', { chatId: '123', count: 50 })
      assert.equal(data.url, '/waInstance1/getChatHistory/secret-token')
      assert.equal(data.method, 'POST')
      assert.deepEqual(JSON.parse(data.body), { chatId: '123', count: 50 })
    }
  )

  await t.test('Should delete the notification by receipt ID and confirm its removal', async () => {
    const { data } = await greenApi.delete<Echo & { result: boolean }>('deleteNotification/42')
    assert.equal(data.url, '/waInstance1/deleteNotification/secret-token/42')
    assert.equal(data.method, 'DELETE')
    assert.equal(data.result, true)
  })

  for (const variant of ['', '/empty']) {
    await t.test(
      `Should return no notification for ${variant ? 'an empty body' : 'JSON null'}`,
      async () => {
        assert.equal((await greenApi.get(`receiveNotification${variant}`)).data, null)
      }
    )
  }

  await t.test('Should preserve a valid notification for processing', async () => {
    assert.deepEqual((await greenApi.get('receiveNotification/valid')).data, {
      receiptId: 1,
      body: { typeWebhook: 'stateInstanceChanged' }
    })
  })

  for (const variant of [
    'missing',
    'noBody',
    'nullBody',
    'noReceipt',
    'invalidReceipt',
    'noWebhook'
  ]) {
    await t.test(`Should reject malformed notifications: ${variant}`, async () => {
      await assert.rejects(
        greenApi.get(`receiveNotification/${variant}`),
        /неверный формат входящего уведомления/
      )
    })
  }

  await t.test('Should expose a business error returned with HTTP 200', async () => {
    await assert.rejects(greenApi.post('checkAccount/businessError'), /Account unavailable/)
  })

  await t.test('Should explain a business error without a reason', async () => {
    await assert.rejects(greenApi.get('unknownBusinessError'), /GREEN-API: Неизвестная ошибка/)
  })

  await t.test('Should reject an account response without an existing MAX chat', async () => {
    await assert.rejects(greenApi.post('checkAccount/missing'), /Аккаунт MAX.*не найден/)
  })

  await t.test('Should reject a send without a message confirmation', async () => {
    await assert.rejects(greenApi.post('sendMessage/missing'), /не подтвердил отправку/)
  })

  await t.test('Should reject a deletion without confirmation', async () => {
    await assert.rejects(greenApi.delete('deleteNotification/missing'), /подтвердить получение/)
  })

  await t.test('Should explain HTTP errors without exposing instance credentials', async () => {
    await assert.rejects(greenApi.get('failure'), (error: unknown) => {
      assert.ok(error instanceof Error)
      assert.match(error.message, /ошибку 401/)
      assert.ok(!inspect(error).includes('secret-token'))
      return true
    })
  })

  await t.test('Should report a request timeout', async () => {
    await assert.rejects(greenApi.get('timeout', { timeout: 20 }), /GREEN-API не ответил вовремя/)
  })

  await t.test('Should reject invalid JSON instead of accepting it as API data', async () => {
    await assert.rejects(greenApi.get('invalid'), /GREEN-API вернул неверный JSON/)
  })

  await t.test(
    'Should report an unavailable API without exposing instance credentials',
    async () => {
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve()))
      )
      await assert.rejects(greenApi.get('getChats'), (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.match(error.message, /Не удалось выполнить запрос/)
        assert.ok(!inspect(error).includes('secret-token'))
        return true
      })
    }
  )

  await t.test(
    'Should keep concurrent instance requests isolated from each other and env credentials',
    async () => {
      const otherApi = createGreenApi({ idInstance: '2', apiTokenInstance: 'other-token' })
      // The unavailable server was checked above; intercept requests here to inspect their resolved paths.
      const urls: string[] = []
      for (const client of [greenApi, otherApi]) {
        client.defaults.adapter = async config => {
          urls.push(`${config.baseURL}/${config.url}`)
          return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
        }
      }
      await Promise.all([greenApi.get('echo'), otherApi.get('echo')])
      assert.ok(urls.some(url => url.endsWith('/waInstance1/echo/secret-token')))
      assert.ok(urls.some(url => url.endsWith('/waInstance2/echo/other-token')))
      assert.ok(urls.every(url => !url.includes('env-token-must-not-be-used')))
    }
  )
})
