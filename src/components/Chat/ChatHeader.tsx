import type { Chat } from '@/types'

import { getAvatarInitials } from '@/lib'
import { ActionIcon, Avatar, Group, Paper, Stack, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

interface ChatHeaderProps {
  chat?: Chat
  chatId: string
}

const ChatHeader = ({ chat, chatId }: ChatHeaderProps) => {
  const title = chat?.name || `Чат ${chatId}`
  const initials = getAvatarInitials(title)

  return (
    <Paper component="header" radius={0} withBorder p="md">
      <Group wrap="nowrap">
        <ActionIcon
          size={44}
          variant="subtle"
          aria-label="Новый чат"
          renderRoot={props => <Link {...props} to="/" />}
        >
          <ArrowLeftIcon size={22} aria-hidden="true" />
        </ActionIcon>
        <Avatar color="blue" radius="xl">
          {initials}
        </Avatar>
        <Stack gap={2} miw={0} flex={1}>
          <Text fw={600} truncate>
            {title}
          </Text>
        </Stack>
      </Group>
    </Paper>
  )
}

export default ChatHeader
