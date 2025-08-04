import { Box, Text } from 'ink'
import { default as InkSpinner } from 'ink-spinner'
import type { SpinnerName } from 'cli-spinners'
import { useAppUIContext } from '@contexts/AppUIContext.js'

type SpinnerProps = {
  text?: string
  type?: SpinnerName
  height?: number
}

export function Spinner({ text, type = 'dots', height = 6 }: SpinnerProps) {
  const { theme } = useAppUIContext()

  return (
    <Box justifyContent="center" alignItems="center" height={height}>
      <Text color={theme.colors.primary}>
        <InkSpinner type={type} /> {text}
      </Text>
    </Box>
  )
}
