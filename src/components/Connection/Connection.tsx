import type { GreenApiCredentials } from '@/types'

import { CONNECTION_STORAGE_KEY } from '@/constants'
import { validateCredentialsInput } from '@/lib'
import { getInstanceSettings } from '@/services'
import {
  Alert,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { useSessionStorage } from '@siberiacancode/reactuse'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

const Connection = () => {
  const queryClient = useQueryClient()
  const storage = useSessionStorage<GreenApiCredentials>(CONNECTION_STORAGE_KEY)
  const navigate = useNavigate()
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState('')
  const connectionMutation = useMutation({
    mutationFn: (credentials: GreenApiCredentials) => getInstanceSettings({ data: credentials })
  })

  const onConnect = async () => {
    if (connectionMutation.isPending) return
    setError('')
    try {
      const credentials = validateCredentialsInput({ idInstance, apiTokenInstance })
      queryClient.clear()
      await connectionMutation.mutateAsync(credentials)
      storage.set(credentials)
      await navigate({ to: '/', replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подключиться к инстансу')
    }
  }

  return (
    <Center component="main" mih="100dvh" p="md">
      <Paper withBorder radius="lg" p="xl" w="100%" maw={440}>
        <Stack>
          <Title order={1} size="h2">
            Подключение
          </Title>
          <Text c="dimmed">Введите данные инстанса из личного кабинета GREEN-API.</Text>
          <form
            onSubmit={event => {
              event.preventDefault()
              void onConnect()
            }}
          >
            <Stack>
              <TextInput
                label="idInstance"
                name="idInstance"
                inputMode="numeric"
                required
                value={idInstance}
                onChange={event => setIdInstance(event.currentTarget.value)}
                disabled={connectionMutation.isPending}
              />
              <PasswordInput
                label="apiTokenInstance"
                name="apiTokenInstance"
                autoComplete="off"
                required
                value={apiTokenInstance}
                onChange={event => setApiTokenInstance(event.currentTarget.value)}
                disabled={connectionMutation.isPending}
              />
              <Button type="submit" loading={connectionMutation.isPending}>
                Подключиться
              </Button>
              {error && (
                <Alert color="red" role="alert">
                  {error}
                </Alert>
              )}
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Center>
  )
}

export default Connection
