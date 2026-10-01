import type { GreenApiCredentials } from '@/types'

import { CONNECTION_STORAGE_KEY } from '@/constants'
import { getInstanceSettings } from '@/services'
import { Alert, Button, Center, Loader, Stack } from '@mantine/core'
import { useSessionStorage } from '@siberiacancode/reactuse'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import AppLayout from '../Layout/AppLayout'

interface ConnectedProps {
  credentials: GreenApiCredentials
}

const VerifiedConnection = ({ credentials }: ConnectedProps) => {
  const navigate = useNavigate()
  const storage = useSessionStorage<GreenApiCredentials>(CONNECTION_STORAGE_KEY)
  const [disconnectError, setDisconnectError] = useState('')
  const settingsQuery = useQuery({
    queryKey: ['settings', credentials.idInstance],
    queryFn: ({ signal }) => getInstanceSettings({ data: credentials, signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false
  })

  const onDisconnect = async () => {
    try {
      storage.remove()
      await navigate({ to: '/connect', replace: true })
    } catch {
      setDisconnectError('Не удалось очистить sessionStorage. Проверьте настройки браузера.')
    }
  }

  if (settingsQuery.isPending)
    return (
      <Center mih="100dvh">
        <Loader aria-label="Проверка подключения" />
      </Center>
    )
  if (settingsQuery.error || disconnectError)
    return (
      <Center mih="100dvh" p="md">
        <Stack maw={440}>
          <Alert color="red" role="alert">
            {disconnectError || settingsQuery.error?.message}
          </Alert>
          <Button onClick={() => void onDisconnect()}>Ввести другие данные</Button>
        </Stack>
      </Center>
    )

  const settings = settingsQuery.data
  const settingsWarning =
    settings.incomingWebhook !== 'yes' || settings.webhookUrl
      ? 'Для получения ответов откройте настройки инстанса GREEN-API: включите «Получать уведомления о входящих сообщениях» (incomingWebhook=yes) и очистите Webhook URL. После применения настроек отправьте новое сообщение с телефона получателя.'
      : undefined
  return (
    <AppLayout
      credentials={credentials}
      onDisconnect={() => void onDisconnect()}
      settingsWarning={settingsWarning}
    />
  )
}

const Connected = (props: ConnectedProps) => {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  )
  return (
    <QueryClientProvider client={queryClient}>
      <VerifiedConnection {...props} />
    </QueryClientProvider>
  )
}

export default Connected
