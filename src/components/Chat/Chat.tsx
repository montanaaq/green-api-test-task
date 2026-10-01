import { useChatContext } from '@/contexts'
import { Stack } from '@mantine/core'

import ChatEmpty from './ChatEmpty'
import ChatHeader from './ChatHeader'
import ChatLoading from './ChatLoading'
import ChatMessages from './ChatMessages'
import MessageComposer from './Message/MessageComposer'
import { useChatConversation } from './useChatConversation'

interface ChatProps {
  chatId: string
}

const Chat = ({ chatId }: ChatProps) => {
  const { chats } = useChatContext()
  const chat = chats.find(item => item.chatId === chatId)
  const { messages, loading, error, sending, onSend } = useChatConversation({ chatId })
  const state = loading ? 'loading' : messages.length ? 'messages' : 'empty'
  const content = {
    loading: <ChatLoading />,
    messages: <ChatMessages messages={messages} />,
    empty: <ChatEmpty />
  }

  return (
    <Stack flex={1} mih={0} gap={0}>
      <ChatHeader chat={chat} chatId={chatId} />
      {content[state]}
      <MessageComposer error={error} sending={sending} onSend={onSend} />
    </Stack>
  )
}

export default Chat
