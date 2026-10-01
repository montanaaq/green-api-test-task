import { Anchor, Center, Stack, Text, Title } from '@mantine/core'
import { Link } from '@tanstack/react-router'

const NotFound = () => (
  <Center h="100dvh" p="md">
    <Stack align="center">
      <Title order={1} size="h2">
        Страница не найдена
      </Title>
      <Text>
        <Anchor renderRoot={props => <Link {...props} to="/" />}>На главную</Anchor>
      </Text>
    </Stack>
  </Center>
)

export default NotFound
