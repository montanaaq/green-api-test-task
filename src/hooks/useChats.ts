import type { Chat, GreenApiCredentials, Message } from '@/types'

import { mergeMessages } from '@/lib'
import { getChats, receiveNotification } from '@/services'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export const useChats = (credentials: GreenApiCredentials) => {
  const queryClient = useQueryClient()
  const [addedChats, setAddedChats] = useState<Chat[]>([])
  const deliveryErrorsQuery = useQuery<Record<string, Record<string, string>>>({
    queryKey: ['deliveryErrors'],
    queryFn: () => ({}),
    initialData: {},
    enabled: false,
    gcTime: Infinity
  })
  const chatsQuery = useQuery({
    queryKey: ['chats', credentials.idInstance],
    queryFn: ({ signal }) => getChats({ data: credentials, signal }),
    staleTime: 10_000,
    refetchOnWindowFocus: false
  })

  const receiveQuery = useQuery({
    queryKey: ['receiveNotification', credentials.idInstance],
    queryFn: () => receiveNotification({ data: credentials }),
    refetchIntervalInBackground: true,
    refetchInterval: query => (query.state.status === 'error' ? 5_000 : 1_000),
    refetchOnWindowFocus: false,
    retry: false
  })
  const notification = receiveQuery.data

  useEffect(() => {
    if (!notification) return
    if (notification.type === 'deliveryError') {
      const { chatId, idMessage, error } = notification
      queryClient.setQueryData<Record<string, Record<string, string>>>(
        ['deliveryErrors'],
        current => ({
          ...current,
          [chatId]: { ...current?.[chatId], [idMessage]: error }
        })
      )
      return
    }
    const incoming = notification.message
    const historyKey = ['history', incoming.chatId]
    queryClient.setQueryData<Message[]>(historyKey, current =>
      mergeMessages(current ?? [], [incoming])
    )
    void queryClient.invalidateQueries({ queryKey: historyKey, refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: ['chats', credentials.idInstance] })
  }, [notification, queryClient, credentials.idInstance])

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
    receivingError: receiveQuery.error?.message,
    deliveryErrors: deliveryErrorsQuery.data,
    chats,
    chatsError: chatsQuery.error?.message,
    addChat,
    loadChats
  }
}
