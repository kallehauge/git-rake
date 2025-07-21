import { Box, Text } from 'ink'
import { useTheme } from '@contexts/ThemeProvider.js'

interface HelpBarProps {
  helpText: string
  showExitWarning?: boolean
}

export function HelpBar({ helpText, showExitWarning }: HelpBarProps) {
  const { theme } = useTheme()

  return (
    <Box borderStyle="single" borderColor={theme.colors.secondary} paddingX={1}>
      {showExitWarning ? (
        <Text color={theme.colors.warning}>Press Ctrl+C again to exit</Text>
      ) : (
        <Text color={theme.colors.secondary}>{helpText} • ctrl+c: exit</Text>
      )}
    </Box>
  )
}
