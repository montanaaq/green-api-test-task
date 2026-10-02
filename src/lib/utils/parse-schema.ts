import type { z } from 'zod'

export const parseSchema = <T>(schema: z.ZodType<T>, data: unknown, message: string): T => {
  const result = schema.safeParse(data)
  if (!result.success) throw new Error(message)
  return result.data
}
