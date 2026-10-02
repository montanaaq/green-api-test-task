import { z } from 'zod'

import { parseSchema } from './parse-schema.ts'

const credentialsShape = z.object({ idInstance: z.string(), apiTokenInstance: z.string() })
export const credentialsSchema = z.object({
  idInstance: z
    .string()
    .trim()
    .regex(/^\d{1,32}$/),
  apiTokenInstance: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{1,256}$/)
})
const phoneSchema = z
  .string()
  .transform(value => value.replace(/\D/g, ''))
  .pipe(z.string().regex(/^7\d{10}$/))
const phoneInputSchema = z.object({ phone: z.string() })
const chatInputSchema = z.object({ chatId: z.string().regex(/^\d{1,32}$/) })
const messageShape = z.object({ message: z.string() })
const messageSchema = z
  .string()
  .trim()
  .refine(value => value.length > 0 && value.length <= 4000)

export const normalizePhone = (value: string) =>
  parseSchema(phoneSchema, value, 'Введите номер РФ в международном формате')

export const validatePhoneInput = (data: unknown) => {
  const { phone } = parseSchema(phoneInputSchema, data, 'Укажите номер телефона')
  return { phone: normalizePhone(phone) }
}

export const validateChatInput = (data: unknown) =>
  parseSchema(chatInputSchema, data, 'Неверный идентификатор чата')

export const validateMessageInput = (data: unknown) => {
  const { chatId } = validateChatInput(data)
  const input = parseSchema(messageShape, data, 'Неверные данные сообщения')
  const message = parseSchema(
    messageSchema,
    input.message,
    'Сообщение должно содержать от 1 до 4000 символов'
  )
  return { chatId, message }
}

export const validateCredentialsInput = (data: unknown) => {
  const input = parseSchema(credentialsShape, data, 'Укажите idInstance и apiTokenInstance')
  return parseSchema(credentialsSchema, input, 'Проверьте формат idInstance и apiTokenInstance')
}
