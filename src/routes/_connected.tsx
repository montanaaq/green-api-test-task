import { Connected } from '@/components'
import { CONNECTION_STORAGE_KEY } from '@/constants'
import { validateCredentialsInput } from '@/lib'
import { createFileRoute, redirect } from '@tanstack/react-router'

const ConnectedRoute = () => {
  const { credentials } = Route.useRouteContext()
  if (!credentials) return null
  return <Connected credentials={credentials} />
}

export const Route = createFileRoute('/_connected')({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === 'undefined') return { credentials: undefined }
    try {
      const credentials = validateCredentialsInput(
        JSON.parse(window.sessionStorage.getItem(CONNECTION_STORAGE_KEY) ?? 'null')
      )
      return { credentials }
    } catch {
      throw redirect({ to: '/connect' })
    }
  },
  component: ConnectedRoute
})
