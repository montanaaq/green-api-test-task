import type { GreenApiCredentials } from '@/types'

import { ChatContext } from '@/contexts'
import { useChats } from '@/hooks'
import { Alert, Flex, Paper } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { useState } from 'react'

import AppSidebar from './AppSidebar'

interface AppLayoutProps {
  credentials: GreenApiCredentials
  onDisconnect: () => void
}

const AppContent = ({ credentials, onDisconnect }: AppLayoutProps) => {
  const { chats, chatsError, addChat, loadChats, settingsWarning, receivingError } =
    useChats(credentials)

  return (
    <ChatContext.Provider value={{ chats, addChat, credentials }}>
      <Flex h="100dvh" mih={0} style={{ overflow: 'hidden' }}>
        <AppSidebar chats={chats} onLoadChats={loadChats} onDisconnect={onDisconnect} />
        <Paper component="main" radius={0} flex={1} miw={0}>
          <Flex direction="column" h="100%" mih={0}>
            {chatsError && (
              <Alert color="red" role="alert">
                {chatsError}
              </Alert>
            )}
            {settingsWarning && (
              <Alert color="yellow" role="alert">
                {settingsWarning}
              </Alert>
            )}
            {receivingError && (
              <Alert color="red" role="alert">
                {receivingError}
              </Alert>
            )}
            <Outlet />
          </Flex>
        </Paper>
      </Flex>
    </ChatContext.Provider>
  )
}

const AppLayout = (props: AppLayoutProps) => {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  )
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent {...props} />
    </QueryClientProvider>
  )
}

export default AppLayout
