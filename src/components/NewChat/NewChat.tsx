import { useChatContext } from '@/contexts'
import { checkAccount } from '@/services'
import { Alert, Badge, Button, Center, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { useMutation } from '@siberiacancode/reactuse'
import { useNavigate } from '@tanstack/react-router'
import { useState, type SubmitEvent } from 'react'

import PhoneInput from './PhoneInput'

const NewChat = () => {
  const { addChat, credentials } = useChatContext()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const chatMutation = useMutation((phone: string) =>
    checkAccount({ data: { ...credentials, phone } })
  )

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (chatMutation.isLoading) return
    setError('')
    try {
      const chat = await chatMutation.mutateAsync(phone)
      addChat(chat)
      await navigate({ to: '/chat/$chatId', params: { chatId: chat.chatId } })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать чат')
    }
  }

  return (
    <Stack gap={0} flex={1} mih={0}>
      <Paper component="header" radius={0} withBorder p="md">
        <Group justify="space-between" mih={44}>
          <Title order={2} size="h4">
            Сообщения
          </Title>
          <Badge variant="light" visibleFrom="sm">
            GREEN-API
          </Badge>
        </Group>
      </Paper>
      <Center flex={1} p={{ base: 'md', sm: 'xl' }} style={{ overflowY: 'auto' }}>
        <Stack w="100%" maw={440} gap="lg">
          <Stack align="center" ta="center" gap="md">
            <Title order={1} size="h2">
              Начните разговор
            </Title>
            <Text c="dimmed">
              Введите номер человека в MAX. Мы найдём его чат и откроем переписку.
            </Text>
          </Stack>
          <form onSubmit={onSubmit}>
            <Stack>
              <PhoneInput onChange={setPhone} disabled={chatMutation.isLoading} />
              <Button type="submit" size="md" fullWidth loading={chatMutation.isLoading}>
                Открыть чат
              </Button>
              {error && (
                <Alert color="red" role="alert">
                  {error}
                </Alert>
              )}
            </Stack>
          </form>
        </Stack>
      </Center>
    </Stack>
  )
}

export default NewChat
