import { Connection } from '@/components'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/connect')({ component: Connection })
