import React from 'react'
import { Box, Text } from 'ink'
import InkSpinner from 'ink-spinner'
import { useTheme } from '@contexts/ThemeProvider.js'

interface SpinnerProps {
  text?: string
  type?:
    | 'dots'
    | 'line'
    | 'pipe'
    | 'simpleDots'
    | 'simpleDotsScrolling'
    | 'star'
    | 'toggle'
}

export function Spinner({ text, type = 'dots' }: SpinnerProps) {
  const { theme } = useTheme()

  return (
    <Box>
      <Text color={theme.colors.primary}>
        <InkSpinner type={type} /> {text}
      </Text>
    </Box>
  )
}
