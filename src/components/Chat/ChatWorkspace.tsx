import type { GreenApiCredentials } from '@/types'

import { ChatContext } from '@/contexts'
import { useChats } from '@/hooks'
import { Alert } from '@mantine/core'
import { Outlet } from '@tanstack/react-router'

import AppLayout from '../Layout/AppLayout'
import AppSidebar from '../Layout/AppSidebar'

interface ChatWorkspaceProps {
  credentials: GreenApiCredentials
  onDisconnect: () => void
  settingsWarning?: string
}

const ChatWorkspace = ({ credentials, onDisconnect, settingsWarning }: ChatWorkspaceProps) => {
  const { chats, chatsError, addChat, loadChats, receivingError, deliveryErrors } =
    useChats(credentials)

  return (
    <ChatContext.Provider value={{ chats, addChat, credentials, deliveryErrors }}>
      <AppLayout
        sidebar={<AppSidebar chats={chats} onLoadChats={loadChats} onDisconnect={onDisconnect} />}
      >
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
      </AppLayout>
    </ChatContext.Provider>
  )
}

export default ChatWorkspace
