import { ReactNode } from 'react'
import { Box, Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { StatusBar } from '@components/status-bar/StatusBar.js'
import { HelpBar } from '@components/HelpBar.js'
import { type StatusBarType } from '@components/status-bar/StatusBar.types.js'
import { getStatusBarTypeColor } from '@components/status-bar/utils.js'

type ViewLayoutProps = {
  children: ReactNode
  statusBarContent?: ReactNode
  helpText: string
  currentPath: string
  statusBarType?: StatusBarType
}

export function ViewLayout({
  children,
  statusBarContent,
  helpText,
  currentPath,
  statusBarType = 'default',
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
        borderColor={getStatusBarTypeColor(statusBarType, theme)}
        paddingX={1}
      >
        <StatusBar title="Git Rake">{statusBarContent}</StatusBar>
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
    </Box>
  )
}
