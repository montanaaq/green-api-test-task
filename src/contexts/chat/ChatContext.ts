import type { ChatContextValue } from '@/types'

import { createContext, useContext } from 'react'

export const ChatContext = createContext<ChatContextValue | null>(null)

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error('ChatContext is missing')
  return context
}
