import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  )
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default QueryProvider
