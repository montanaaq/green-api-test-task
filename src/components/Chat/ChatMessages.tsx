import type { Message } from '@/types'

import { ScrollArea, Stack } from '@mantine/core'
import { useAutoScroll, useEvent } from '@siberiacancode/reactuse'
import { useRef } from 'react'

import MessageBubble from './Message/MessageBubble'

interface ChatMessagesProps {
  messages: Message[]
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const viewportRef = useRef<HTMLDivElement>(null)
  useAutoScroll(viewportRef)
  const onViewportRef = useEvent((node: HTMLDivElement | null) => {
    viewportRef.current = node
    node?.scrollTo({ top: node.scrollHeight })
  })

  return (
    <ScrollArea
      flex={1}
      mih={0}
      scrollbars="y"
      offsetScrollbars
      viewportRef={onViewportRef}
      viewportProps={{
        role: 'log',
        'aria-label': 'Сообщения',
        'aria-live': 'polite',
        'aria-relevant': 'additions'
      }}
    >
      <Stack maw={910} mx="auto" p={{ base: 'sm', sm: 'md' }} gap="xs">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </Stack>
    </ScrollArea>
  )
}

export default ChatMessages
