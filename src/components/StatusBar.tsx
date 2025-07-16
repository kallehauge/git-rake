import { ReactNode } from 'react'
import { Box, Text } from 'ink'
import { useTheme } from '@contexts/ThemeProvider.js'

interface StatusBarProps {
  children?: ReactNode
  restoreMode?: boolean
}

export function StatusBar({ children, restoreMode = false }: StatusBarProps) {
  const { theme } = useTheme()

  return (
    <Box borderStyle="single" borderColor={theme.colors.primary} paddingX={1}>
      <Text color={theme.colors.primary} bold>
        Git Rake{restoreMode ? ' - Restore Mode' : ''}
      </Text>

      {children && (
        <>
          <Text color={theme.colors.text}> • </Text>
          {children}
        </>
      )}
    </Box>
  )
}
