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
}

export interface ChatContextValue {
  credentials: GreenApiCredentials
  chats: Chat[]
  addChat: (chat: Chat) => void
}
