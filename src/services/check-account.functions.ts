import { validateCredentialsInput, validatePhoneInput } from '@/lib'
import { parseAccountResponse } from '@/lib/green-api/green-api.schema'
import { createApi } from '@/lib/green-api/green-api.server'
import { createServerFn } from '@tanstack/react-start'

export const checkAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    ...validateCredentialsInput(data),
    ...validatePhoneInput(data)
  }))
  .handler(async ({ data }) => {
    const api = createApi(data)
    const response = await api.post<unknown>(
      'checkAccount',
      { phoneNumber: Number(data.phone) },
      { timeout: 30_000 }
    )
    const chatId = parseAccountResponse(response.data)
    return { chatId, name: `+${data.phone}`, phoneNumber: data.phone }
  })
