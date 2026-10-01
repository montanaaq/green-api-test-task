import type { Message } from '@/types'

import { useChatContext } from '@/contexts'
import { mergeMessages } from '@/lib'
import { getChatHistory, sendMessage } from '@/services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface ConversationOptions {
  chatId: string
}

export const useChatConversation = ({ chatId }: ConversationOptions) => {
  const { credentials, deliveryErrors } = useChatContext()
  const queryClient = useQueryClient()
  const historyKey = ['history', chatId]
  const historyQuery = useQuery({
    queryKey: historyKey,
    queryFn: async ({ signal }) => {
      const history = await getChatHistory({ data: { ...credentials, chatId }, signal })
      return mergeMessages(history, queryClient.getQueryData<Message[]>(historyKey) ?? [])
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false
  })
  const sendMutation = useMutation({
    mutationFn: (message: string) => sendMessage({ data: { ...credentials, chatId, message } }),
    onSuccess: sent =>
      queryClient.setQueryData<Message[]>(historyKey, current =>
        mergeMessages(current ?? [], [sent])
      )
  })

  const onSend = (message: string) =>
    sendMutation.mutateAsync(message).then(
      () => true,
      () => false
    )

  const messages = (historyQuery.data ?? []).map(message => ({
    ...message,
    deliveryError: deliveryErrors[chatId]?.[message.id] ?? message.deliveryError
  }))
  const error = [historyQuery.error?.message, sendMutation.error?.message]
    .filter(Boolean)
    .join('\n')

  return {
    messages,
    loading: historyQuery.isPending,
    error,
    sending: sendMutation.isPending,
    onSend
  }
}
