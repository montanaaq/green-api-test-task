import type { Chat } from '@/types'

import { getAvatarInitials } from '@/lib'
import { ActionIcon, Avatar, Tooltip } from '@mantine/core'
import { Link } from '@tanstack/react-router'

interface SidebarChatProps {
  chat: Chat
  active: boolean
}

const SidebarChatItem = ({ chat, active }: SidebarChatProps) => {
  const initials = getAvatarInitials(chat.name)
  const variant = active ? 'filled' : 'light'

  return (
    <Tooltip label={chat.name} position="right">
      <ActionIcon
        size={44}
        radius="xl"
        variant={variant}
        aria-label={chat.name}
        renderRoot={props => (
          <Link {...props} to="/chat/$chatId" params={{ chatId: chat.chatId }} />
        )}
      >
        <Avatar size={36} radius="xl" color="blue" variant={variant}>
          {initials}
        </Avatar>
      </ActionIcon>
    </Tooltip>
  )
}

export default SidebarChatItem
