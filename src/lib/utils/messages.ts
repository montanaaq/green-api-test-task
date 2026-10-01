import type { Message } from '@/types'

export const getDeliveryError = (status: unknown) => {
  switch (status) {
    case 'failed':
      return 'Не удалось доставить сообщение'
    case 'noAccount':
      return 'У получателя нет аккаунта MAX'
    case 'notInGroup':
      return 'Отправитель не состоит в этом чате'
    default:
      return undefined
  }
}

export const mergeMessages = (history: Message[], updates: Message[]) => {
  const messages = new Map(history.map(message => [message.id, message]))
  for (const update of updates) {
    const current = messages.get(update.id)
    const deliveryError = update.deliveryError ?? current?.deliveryError
    messages.set(update.id, deliveryError ? { ...update, deliveryError } : update)
  }
  return Array.from(messages.values()).sort((first, second) => first.timestamp - second.timestamp)
}
