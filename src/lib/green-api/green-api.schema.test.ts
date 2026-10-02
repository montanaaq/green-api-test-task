import { expect, it } from 'vitest'

import {
  parseAccountResponse,
  parseChatsResponse,
  parseHistoryResponse,
  parseSendResponse,
  parseSettingsResponse
} from './green-api.schema.ts'

it('Should list personal chats and fall back to a phone number when the name is empty', () => {
  expect(
    parseChatsResponse([
      { type: 'group', chatId: '-1', name: 'Группа' },
      { type: 'user', chatId: '123', name: '', phoneNumber: 79991234567 },
      { type: 'user', chatId: '456', name: 'Анна' }
    ])
  ).toEqual([
    { chatId: '123', name: '79991234567', phoneNumber: '79991234567' },
    { chatId: '456', name: 'Анна', phoneNumber: undefined }
  ])
  expect(() => parseChatsResponse({})).toThrow('Неверный список чатов')
  expect(() => parseChatsResponse([{ type: 'user', chatId: '123' }])).toThrow(
    'Неверные данные чата'
  )
})

it('Should load only text history in chronological order and preserve delivery failures', () => {
  expect(
    parseHistoryResponse(
      [
        {
          typeMessage: 'textMessage',
          idMessage: '2',
          textMessage: 'Ответ',
          timestamp: 2,
          type: 'incoming'
        },
        { typeMessage: 'imageMessage' },
        {
          typeMessage: 'extendedTextMessage',
          idMessage: '1',
          textMessage: 'https://example.com',
          timestamp: 1,
          type: 'outgoing',
          statusMessage: 'failed'
        }
      ],
      '123'
    )
  ).toEqual([
    {
      id: '1',
      chatId: '123',
      text: 'https://example.com',
      timestamp: 1,
      direction: 'outgoing',
      deliveryError: 'Не удалось доставить сообщение'
    },
    {
      id: '2',
      chatId: '123',
      text: 'Ответ',
      timestamp: 2,
      direction: 'incoming',
      deliveryError: undefined
    }
  ])
  expect(() =>
    parseHistoryResponse(
      [
        {
          typeMessage: 'textMessage',
          idMessage: '1',
          textMessage: 'Привет',
          timestamp: 'invalid',
          type: 'incoming'
        }
      ],
      '123'
    )
  ).toThrow('Неверное текстовое сообщение')
})

it('Should require an existing account and a chat ID', () => {
  expect(parseAccountResponse({ exist: true, chatId: '123' })).toBe('123')
  expect(() => parseAccountResponse({ exist: false })).toThrow('не найден')
  expect(() => parseAccountResponse({ exist: true })).toThrow('Отсутствует идентификатор')
})

it('Should require a message ID to confirm a send', () => {
  expect(parseSendResponse({ idMessage: '123' })).toBe('123')
  expect(() => parseSendResponse({ idMessage: '' })).toThrow('Отправка сообщения не подтверждена')
})

it('Should accept only valid receiving settings', () => {
  const settings = { incomingWebhook: 'yes', outgoingMessageWebhook: 'yes', webhookUrl: '' }
  expect(parseSettingsResponse(settings)).toEqual({
    incomingWebhook: 'yes',
    outgoingMessageWebhook: 'yes',
    webhookUrl: ''
  })
  expect(parseSettingsResponse({ ...settings, outgoingMessageWebhook: 'no' })).toEqual({
    ...settings,
    outgoingMessageWebhook: 'no'
  })
  expect(() => parseSettingsResponse({ ...settings, incomingWebhook: true })).toThrow(
    'Неверные настройки'
  )
  expect(() => parseSettingsResponse({ ...settings, outgoingMessageWebhook: true })).toThrow(
    'Неверные настройки'
  )
})
