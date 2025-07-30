import { ReactNode } from 'react'
import { Box, Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { StatusBar } from '@components/StatusBar.js'
import { HelpBar } from '@components/HelpBar.js'

type ViewLayoutProps = {
  children: ReactNode
  statusBarContent?: ReactNode
  restoreMode?: boolean
  helpText: string
  currentPath: string
  confirmationBarContent?: ReactNode
}

export function ViewLayout({
  children,
  statusBarContent,
  restoreMode = false,
  helpText,
  currentPath,
  confirmationBarContent,
}: ViewLayoutProps) {
  const { theme, showExitWarning } = useAppUIContext()

  return (
    <Box flexDirection="column" height="100%" width="100%">
      <Box paddingX={1} flexShrink={0}>
        <Text color={theme.colors.muted}>Cwd: {currentPath}</Text>
      </Box>

      <Box
        flexShrink={0}
        borderStyle="single"
        borderColor={theme.colors.primary}
        paddingX={1}
      >
        <StatusBar restoreMode={restoreMode}>{statusBarContent}</StatusBar>
      </Box>

      {children}

      <Box
        flexShrink={0}
        borderStyle="single"
        borderColor={theme.colors.secondary}
        paddingX={1}
      >
        <HelpBar helpText={helpText} showExitWarning={showExitWarning} />
      </Box>

      {/* Optional Confirmation Bar */}
      {confirmationBarContent}
    </Box>
  )
}
