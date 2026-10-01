import { Center, Loader, Stack, Text } from '@mantine/core'

const ChatLoading = () => (
  <Center flex={1}>
    <Stack align="center" gap="sm" role="status">
      <Loader size="sm" />
      <Text size="sm" c="dimmed">
        Загружаем переписку…
      </Text>
    </Stack>
  </Center>
)

export default ChatLoading
