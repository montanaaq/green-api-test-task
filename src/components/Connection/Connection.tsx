import type { GreenApiCredentials } from '@/types'

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
import { useMutation, useSessionStorage } from '@siberiacancode/reactuse'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import AppLayout from '../Layout/AppLayout'

const deserializeCredentials = (value: string): GreenApiCredentials | undefined => {
  try {
    const parsed: unknown = JSON.parse(value)
    return validateCredentialsInput(parsed)
  } catch {
    return undefined
  }
}

const Connection = () => {
  const storage = useSessionStorage<GreenApiCredentials | undefined>(
    'green-api-credentials',
    undefined,
    {
      deserializer: deserializeCredentials
    }
  )
  const navigate = useNavigate()
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState('')
  const connectionMutation = useMutation((credentials: GreenApiCredentials) =>
    getInstanceSettings({ data: credentials })
  )

  const onConnect = async () => {
    if (connectionMutation.isLoading) return
    setError('')
    try {
      const credentials = validateCredentialsInput({ idInstance, apiTokenInstance })
      await connectionMutation.mutateAsync(credentials)
      await navigate({ to: '/', replace: true })
      storage.set(credentials)
      setIdInstance('')
      setApiTokenInstance('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подключиться к инстансу')
    }
  }

  const onDisconnect = () => {
    try {
      storage.remove()
      setError('')
    } catch {
      setError('Не удалось очистить sessionStorage. Проверьте настройки браузера.')
    }
  }

  if (storage.value) return <AppLayout credentials={storage.value} onDisconnect={onDisconnect} />

  return (
    <Center component="main" mih="100dvh" p="md">
      <Paper withBorder radius="lg" p="xl" w="100%" maw={440}>
        <Stack>
          <Title order={1} size="h2">
            Подключение к MAX
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
                disabled={connectionMutation.isLoading}
              />
              <PasswordInput
                label="apiTokenInstance"
                name="apiTokenInstance"
                autoComplete="off"
                required
                value={apiTokenInstance}
                onChange={event => setApiTokenInstance(event.currentTarget.value)}
                disabled={connectionMutation.isLoading}
              />
              <Button type="submit" loading={connectionMutation.isLoading}>
                Подключиться
              </Button>
              {error && (
                <Alert color="red" role="alert">
                  {error}
                </Alert>
              )}
            </Stack>
          </form>
          <Text size="xs" c="dimmed">
            Данные сохраняются в sessionStorage этой вкладки и удаляются при её закрытии.
          </Text>
        </Stack>
      </Paper>
    </Center>
  )
}

export default Connection
