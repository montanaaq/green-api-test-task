import { NewChat } from '@/components'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_connected/')({ component: NewChat })
