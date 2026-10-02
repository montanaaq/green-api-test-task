import { expect, it } from 'vitest'

import { normalizePhone, validateCredentialsInput, validateMessageInput } from './chat-input.ts'

it('Should normalize a MAX phone and reject numbers outside the supported format', () => {
  expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
  expect(() => normalizePhone('8 999 123-45-67')).toThrow()
})

it('Should accept instance credentials and reject a token that changes the API path', () => {
  expect(
    validateCredentialsInput({ idInstance: ' 123 ', apiTokenInstance: ' token-123 ' })
  ).toEqual({
    idInstance: '123',
    apiTokenInstance: 'token-123'
  })
  expect(() =>
    validateCredentialsInput({ idInstance: '123', apiTokenInstance: '../secret' })
  ).toThrow()
})

it('Should trim a text message and reject an empty send', () => {
  expect(validateMessageInput({ chatId: '123', message: ' Привет ' })).toEqual({
    chatId: '123',
    message: 'Привет'
  })
  expect(() => validateMessageInput({ chatId: '123', message: ' ' })).toThrow()
  expect(() => validateMessageInput({ chatId: '123', message: '😀'.repeat(2001) })).toThrow(
    'Сообщение должно содержать от 1 до 4000 символов'
  )
  expect(validateMessageInput({ chatId: '123', message: '😀'.repeat(2000) }).message).toHaveLength(
    4000
  )
})

it('Should reject invalid credential input without exposing its contents', () => {
  expect(() => validateCredentialsInput(null)).toThrow('Укажите idInstance и apiTokenInstance')
  expect(() =>
    validateCredentialsInput({ idInstance: '123', apiTokenInstance: '../secret' })
  ).toThrow('Проверьте формат idInstance и apiTokenInstance')
  expect(() =>
    validateCredentialsInput({ idInstance: '123', apiTokenInstance: '../secret' })
  ).not.toThrow('secret')
})
