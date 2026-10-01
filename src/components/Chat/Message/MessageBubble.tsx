import type { Message } from '@/types'

import { Paper, Text } from '@mantine/core'
import { cn } from '@siberiacancode/reactuse'

import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: Message
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const sentAt = new Date(message.timestamp * 1000)
  const dateTime = sentAt.toISOString()
  const timeLabel = sentAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const outgoing = message.direction === 'outgoing'
  const bubbleClassName = cn({ [styles.outgoing]: outgoing, [styles.incoming]: !outgoing })
  const timeColor = outgoing ? 'blue.1' : 'dimmed'

  return (
    <Paper radius="lg" px="sm" py={6} className={bubbleClassName} maw={{ base: '90%', sm: '70%' }}>
      <Text size="sm" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {message.text}
      </Text>
      <Text
        component="time"
        dateTime={dateTime}
        display="block"
        size="xs"
        c={timeColor}
        ta="right"
        mt={2}
      >
        {timeLabel}
      </Text>
    </Paper>
  )
}

export default MessageBubble
