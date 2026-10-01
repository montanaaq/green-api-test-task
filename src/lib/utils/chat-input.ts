export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isMessageTimestamp = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= 8_640_000_000_000

export const normalizePhone = (value: string) => {
  const phone = value.replace(/\D/g, '')
  if (!/^7\d{10}$/.test(phone)) {
    throw new Error('Введите номер РФ в международном формате')
  }
  return phone
}

export const validatePhoneInput = (data: unknown) => {
  if (!isRecord(data) || typeof data.phone !== 'string') {
    throw new Error('Укажите номер телефона')
  }
  return { phone: normalizePhone(data.phone) }
}

export const validateChatInput = (data: unknown) => {
  if (!isRecord(data) || typeof data.chatId !== 'string' || !/^\d{1,32}$/.test(data.chatId)) {
    throw new Error('Неверный идентификатор чата')
  }
  return { chatId: data.chatId }
}

export const validateMessageInput = (data: unknown) => {
  const { chatId } = validateChatInput(data)
  if (!isRecord(data) || typeof data.message !== 'string') {
    throw new Error('Неверные данные сообщения')
  }
  const message = data.message.trim()
  if (!message || message.length > 4000) {
    throw new Error('Сообщение должно содержать от 1 до 4000 символов')
  }
  return { chatId, message }
}

export const validateCredentialsInput = (data: unknown) => {
  if (
    !isRecord(data) ||
    typeof data.idInstance !== 'string' ||
    typeof data.apiTokenInstance !== 'string'
  ) {
    throw new Error('Укажите idInstance и apiTokenInstance')
  }
  const idInstance = data.idInstance.trim()
  const apiTokenInstance = data.apiTokenInstance.trim()
  if (!/^\d{1,32}$/.test(idInstance) || !/^[a-zA-Z0-9_-]{1,256}$/.test(apiTokenInstance)) {
    throw new Error('Проверьте формат idInstance и apiTokenInstance')
  }
  return { idInstance, apiTokenInstance }
}
