import type { ReactNode } from 'react'

import { NotFound } from '@/components'
import { QueryProvider } from '@/contexts'
import { MantineProvider } from '@mantine/core'
import mantineCss from '@mantine/core/styles.css?url'
import { ClientOnly, HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

const RootDocument = ({ children }: { children: ReactNode }) => (
  <html lang="ru" data-mantine-color-scheme="dark">
    <head>
      <HeadContent />
    </head>
    <body>
      <QueryProvider>
        <MantineProvider forceColorScheme="dark">{children}</MantineProvider>
      </QueryProvider>
      <Scripts />
    </body>
  </html>
)

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Чаты' }
    ],
    links: [{ rel: 'stylesheet', href: mantineCss }]
  }),
  component: () => (
    <ClientOnly>
      <Outlet />
    </ClientOnly>
  ),
  notFoundComponent: NotFound,
  shellComponent: RootDocument
})
