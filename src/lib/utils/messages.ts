import type { Message } from '@/types'

export const mergeMessages = (history: Message[], updates: Message[]) =>
  Array.from(new Map([...history, ...updates].map(message => [message.id, message])).values()).sort(
    (first, second) => first.timestamp - second.timestamp
  )
