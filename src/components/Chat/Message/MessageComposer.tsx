import type { KeyboardEvent } from 'react'

import { ActionIcon, Alert, Box, Group, Stack, Textarea } from '@mantine/core'
import { useEvent } from '@siberiacancode/reactuse'
import { SendIcon } from 'lucide-react'
import { useState } from 'react'

interface MessageComposerProps {
  error: string
  sending: boolean
  onSend: (message: string) => Promise<boolean>
}

const MessageComposer = ({ error, sending, onSend }: MessageComposerProps) => {
  const [draft, setDraft] = useState('')

  const onSubmit = async () => {
    if (sending || !draft.trim()) return
    if (await onSend(draft)) setDraft('')
  }

  const onKeyDown = useEvent((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  })

  return (
    <Stack w="100%" maw={910} mx="auto" p="md" gap="xs">
      {error && (
        <Alert color="red" role="alert">
          {error}
        </Alert>
      )}
      <Box
        component="form"
        onSubmit={event => {
          event.preventDefault()
          void onSubmit()
        }}
      >
        <Group align="end" wrap="nowrap" gap="sm">
          <Textarea
            id="message"
            name="message"
            aria-label="Сообщение"
            maxLength={4000}
            placeholder="Сообщение"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={sending}
            autosize
            minRows={1}
            maxRows={5}
            size="md"
            flex={1}
            miw={0}
          />
          <ActionIcon
            type="submit"
            size={44}
            loading={sending}
            disabled={!draft.trim() || sending}
            aria-label="Отправить сообщение"
            title="Отправить сообщение"
          >
            <SendIcon size={22} aria-hidden="true" />
          </ActionIcon>
        </Group>
      </Box>
    </Stack>
  )
}

export default MessageComposer
