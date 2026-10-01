import { Center, Text } from '@mantine/core'

const ChatEmpty = () => (
  <Center flex={1} p="md">
    <Text size="sm" c="dimmed" ta="center" role="status">
      Сообщений пока нет. Напишите первым.
    </Text>
  </Center>
)

export default ChatEmpty
