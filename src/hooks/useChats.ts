import type { Chat, GreenApiCredentials, Message } from '@/types'

import { mergeMessages } from '@/lib'
import { getChats, getInstanceSettings, receiveNotification } from '@/services'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export const useChats = (credentials: GreenApiCredentials) => {
  const queryClient = useQueryClient()
  const [addedChats, setAddedChats] = useState<Chat[]>([])
  const chatsQuery = useQuery({
    queryKey: ['chats', credentials.idInstance],
    queryFn: ({ signal }) => getChats({ data: credentials, signal }),
    staleTime: 10_000,
    refetchOnWindowFocus: false
  })
  const settingsQuery = useQuery({
    queryKey: ['settings', credentials.idInstance],
    queryFn: ({ signal }) => getInstanceSettings({ data: credentials, signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false
  })
  const receiveQuery = useQuery({
    queryKey: ['receiveNotification', credentials.idInstance],
    queryFn: async () => {
      const incoming = await receiveNotification({ data: credentials })
      if (incoming) {
        queryClient.setQueryData<Message[]>(['history', incoming.chatId], current =>
          mergeMessages(current ?? [], [incoming])
        )
        void queryClient.invalidateQueries({
          queryKey: ['history', incoming.chatId],
          refetchType: 'none'
        })
        setAddedChats(current =>
          current.some(chat => chat.chatId === incoming.chatId)
            ? current
            : [...current, { chatId: incoming.chatId, name: incoming.chatId }]
        )
      }
      return incoming
    },
    refetchInterval: query => (query.state.status === 'error' ? 5_000 : 1_000),
    refetchOnWindowFocus: false,
    retry: false
  })
  const settings = settingsQuery.data
  const settingsWarning =
    settings && (settings.incomingWebhook !== 'yes' || settings.webhookUrl)
      ? 'Для получения ответов откройте настройки инстанса GREEN-API: включите «Получать уведомления о входящих сообщениях» (incomingWebhook=yes) и очистите Webhook URL. После применения настроек отправьте новое сообщение с телефона получателя.'
      : undefined
  const receivingError = [settingsQuery.error?.message, receiveQuery.error?.message]
    .filter(Boolean)
    .join('\n')
  const chats = [
    ...addedChats,
    ...(chatsQuery.data ?? []).filter(chat => !addedChats.some(item => item.chatId === chat.chatId))
  ]

  const loadChats = () => {
    if (chatsQuery.isFetching || Date.now() - chatsQuery.dataUpdatedAt < 10_000) return
    void chatsQuery.refetch()
  }

  const addChat = (chat: Chat) => {
    setAddedChats(current => [chat, ...current.filter(item => item.chatId !== chat.chatId)])
  }

  return {
    settingsWarning,
    receivingError,
    chats,
    chatsError: chatsQuery.error?.message,
    addChat,
    loadChats
  }
}
