import type { GreenApiCredentials } from './green-api.types'

export interface Chat {
  chatId: string
  name: string
  phoneNumber?: string
}

export interface Message {
  id: string
  chatId: string
  text: string
  timestamp: number
  direction: 'incoming' | 'outgoing'
  deliveryError?: string
}

export type ChatNotification =
  | { type: 'message'; message: Message }
  | { type: 'deliveryError'; chatId: string; idMessage: string; error: string }

export interface ChatContextValue {
  credentials: GreenApiCredentials
  chats: Chat[]
  addChat: (chat: Chat) => void
  deliveryErrors: Record<string, Record<string, string>>
}
