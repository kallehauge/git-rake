import { Box, Text } from 'ink'
import { useTheme } from '@contexts/ThemeProvider.js'

interface HelpBarProps {
  helpText: string
}

export function HelpBar({ helpText }: HelpBarProps) {
  const { theme } = useTheme()

  return (
    <Box borderStyle="single" borderColor={theme.colors.secondary}>
      <Text color={theme.colors.secondary}>{helpText} • ctrl+c: exit</Text>
    </Box>
  )
}
