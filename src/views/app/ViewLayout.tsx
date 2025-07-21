import { ReactNode } from 'react'
import { Box, Text } from 'ink'
import { useTheme } from '@contexts/ThemeProvider.js'
import { useAppUIContext } from '@contexts/AppProviders.js'
import { StatusBar } from '@components/StatusBar.js'
import { HelpBar } from '@components/HelpBar.js'

interface ViewLayoutProps {
  children: ReactNode
  statusBarContent?: ReactNode
  restoreMode?: boolean
  helpText: string
  currentPath: string
}

export function ViewLayout({
  children,
  statusBarContent,
  restoreMode = false,
  helpText,
  currentPath,
}: ViewLayoutProps) {
  const { theme } = useTheme()
  const { showExitWarning } = useAppUIContext()

  return (
    <Box flexDirection="column" height="100%" width="100%">
      <Box paddingX={1}>
        <Text color={theme.colors.secondary}>Cwd: {currentPath}</Text>
      </Box>

      <StatusBar restoreMode={restoreMode}>{statusBarContent}</StatusBar>

      {children}

      <HelpBar helpText={helpText} showExitWarning={showExitWarning} />
    </Box>
  )
}
