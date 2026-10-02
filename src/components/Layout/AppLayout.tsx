import type { ReactNode } from 'react'

import { Flex, Paper } from '@mantine/core'

interface AppLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

const AppLayout = ({ sidebar, children }: AppLayoutProps) => (
  <Flex h="100dvh" mih={0} style={{ overflow: 'hidden' }}>
    {sidebar}
    <Paper component="main" radius={0} flex={1} miw={0}>
      <Flex direction="column" h="100%" mih={0}>
        {children}
      </Flex>
    </Paper>
  </Flex>
)

export default AppLayout
