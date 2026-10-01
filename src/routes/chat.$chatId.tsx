import { Chat } from '@/components'
import { createFileRoute } from '@tanstack/react-router'

const ChatRoute = () => {
  const { chatId } = Route.useParams()
  return <Chat key={chatId} chatId={chatId} />
}

export const Route = createFileRoute('/chat/$chatId')({ component: ChatRoute })
