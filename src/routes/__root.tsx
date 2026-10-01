import type { ReactNode } from 'react'

import { Connection, NotFound } from '@/components'
import { MantineProvider } from '@mantine/core'
import mantineCss from '@mantine/core/styles.css?url'
import { ClientOnly, HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

const RootDocument = ({ children }: { children: ReactNode }) => (
  <html lang="ru" data-mantine-color-scheme="dark">
    <head>
      <HeadContent />
    </head>
    <body>
      <MantineProvider forceColorScheme="dark">{children}</MantineProvider>
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
      <Connection />
    </ClientOnly>
  ),
  notFoundComponent: NotFound,
  shellComponent: RootDocument
})
