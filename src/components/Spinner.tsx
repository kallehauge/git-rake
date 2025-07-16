import { Box, Text } from 'ink'
import InkSpinner from 'ink-spinner'
import type { SpinnerName } from 'cli-spinners'
import { useTheme } from '@contexts/ThemeProvider.js'

interface SpinnerProps {
  text?: string
  type?: SpinnerName
}

export function Spinner({ text, type = 'dots' }: SpinnerProps) {
  const { theme } = useTheme()

  return (
    <Box justifyContent="center" alignItems="center" height={6}>
      <Text color={theme.colors.primary}>
        <InkSpinner type={type} /> {text}
      </Text>
    </Box>
  )
}
