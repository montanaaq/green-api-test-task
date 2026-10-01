import { validateCredentialsInput } from '@/lib'
import { receiveApiNotification } from '@/lib/green-api/green-api.server'
import { createServerFn } from '@tanstack/react-start'

export const receiveNotification = createServerFn({ method: 'POST' })
  .validator(validateCredentialsInput)
  .handler(({ data }) => receiveApiNotification(data))
