import type { Chat } from '@/types'

import { ActionIcon, Divider, Paper, ScrollArea, Stack, Text, Tooltip } from '@mantine/core'
import { Link, useRouterState } from '@tanstack/react-router'
import { LogOutIcon, MessageSquareIcon, PlusIcon } from 'lucide-react'

import SidebarChat from './SidebarChat'

interface AppSidebarProps {
  chats: Chat[]
  onLoadChats: () => void
  onDisconnect: () => void
}

const AppSidebar = ({ chats, onLoadChats, onDisconnect }: AppSidebarProps) => {
  const pathname = useRouterState({ select: state => state.location.pathname })

  return (
    <Paper
      component="aside"
      radius={0}
      withBorder
      w={{ base: 64, sm: 80 }}
      p="xs"
      style={{ flexShrink: 0 }}
      aria-label="Навигация по чатам"
    >
      <Stack align="center" h="100%" gap="md">
        <Tooltip label="Главная" position="right">
          <ActionIcon
            onClick={onLoadChats}
            size={44}
            variant="light"
            aria-label="Главная"
            renderRoot={props => <Link {...props} to="/" />}
          >
            <MessageSquareIcon size={24} aria-hidden="true" />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Новый чат" position="right">
          <ActionIcon
            onClick={onLoadChats}
            size={44}
            radius="xl"
            aria-label="Новый чат"
            renderRoot={props => <Link {...props} to="/" />}
          >
            <PlusIcon size={24} aria-hidden="true" />
          </ActionIcon>
        </Tooltip>
        <Divider w="100%" />
        <Text size="xs" c="dimmed">
          ЧАТЫ
        </Text>
        <ScrollArea flex={1} mih={0} w="100%" scrollbars="y" scrollbarSize={4}>
          <Stack
            component="nav"
            align="center"
            gap="sm"
            aria-label="Список чатов"
            onClick={onLoadChats}
          >
            {chats.map(chat => (
              <SidebarChat
                key={chat.chatId}
                chat={chat}
                active={pathname === `/chat/${chat.chatId}`}
              />
            ))}
          </Stack>
        </ScrollArea>
        <Tooltip label="Сменить инстанс" position="right">
          <ActionIcon
            onClick={onDisconnect}
            size={44}
            variant="subtle"
            aria-label="Сменить инстанс"
          >
            <LogOutIcon size={24} aria-hidden="true" />
          </ActionIcon>
        </Tooltip>
      </Stack>
    </Paper>
  )
}

export default AppSidebar
