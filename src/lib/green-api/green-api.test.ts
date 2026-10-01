import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCredentialsInput,
  normalizePhone,
  validatePhoneInput,
  validateChatInput,
  validateMessageInput
} from '../utils/chat-input.ts'
import { parseIncomingMessage } from './green-api.ts'

test('MAX phone numbers use international Russian format', () => {
  assert.equal(normalizePhone('+7 (999) 123-45-67'), '79991234567')
  assert.throws(() => normalizePhone('+375 29 123-45-67'))
  assert.throws(() => normalizePhone('8 999 123-45-67'))
  assert.throws(() => normalizePhone('12345'))
})

test('text notifications preserve plain text and links, and ignore other events', () => {
  const notification = {
    receiptId: 1,
    body: {
      typeWebhook: 'incomingMessageReceived',
      idMessage: 'message-1',
      timestamp: 123,
      senderData: { chatId: '10000000' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } }
    }
  }
  assert.deepEqual(parseIncomingMessage(notification), {
    id: 'message-1',
    chatId: '10000000',
    timestamp: 123,
    text: 'Привет',
    direction: 'incoming'
  })
  assert.equal(
    parseIncomingMessage({
      ...notification,
      body: {
        ...notification.body,
        messageData: {
          typeMessage: 'extendedTextMessage',
          extendedTextMessageData: { text: 'https://example.com' }
        }
      }
    })?.text,
    'https://example.com'
  )
  assert.equal(
    parseIncomingMessage({
      ...notification,
      body: { ...notification.body, typeWebhook: 'stateInstanceChanged' }
    }),
    null
  )
  assert.equal(
    parseIncomingMessage({
      ...notification,
      body: { ...notification.body, messageData: { typeMessage: 'imageMessage' } }
    }),
    null
  )
  assert.throws(
    () =>
      parseIncomingMessage({
        ...notification,
        body: { ...notification.body, messageData: { typeMessage: 'textMessage' } }
      }),
    /неверное текстовое уведомление/
  )
})

test('shared input validators reject invalid form data', () => {
  assert.deepEqual(validatePhoneInput({ phone: '+7 (999) 123-45-67' }), { phone: '79991234567' })
  assert.deepEqual(validateMessageInput({ chatId: '123', message: ' Привет ' }), {
    chatId: '123',
    message: 'Привет'
  })
  assert.throws(() => validatePhoneInput(null))
  assert.throws(() => validatePhoneInput({ phone: 79991234567 }))
  assert.throws(() => validateChatInput({ chatId: '../sendMessage' }))
  assert.throws(() => validateMessageInput({ chatId: '123', message: '' }))
  assert.throws(() => validateMessageInput({ chatId: '123', message: 'x'.repeat(4001) }))
})

test('instance credentials are validated without allowing URL path injection', () => {
  assert.deepEqual(
    validateCredentialsInput({ idInstance: ' 123 ', apiTokenInstance: ' token-123 ' }),
    { idInstance: '123', apiTokenInstance: 'token-123' }
  )
  for (const data of [
    null,
    {},
    { idInstance: 'abc', apiTokenInstance: 'token' },
    { idInstance: '123', apiTokenInstance: '../secret' },
    { idInstance: '123', apiTokenInstance: '' }
  ]) {
    assert.throws(() => validateCredentialsInput(data))
  }
})
