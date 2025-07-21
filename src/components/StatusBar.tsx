import { ReactNode } from 'react'
import { Text } from 'ink'
import { useTheme } from '@contexts/ThemeProvider.js'

interface StatusBarProps {
  children?: ReactNode
  restoreMode?: boolean
}

export function StatusBar({ children, restoreMode = false }: StatusBarProps) {
  const { theme } = useTheme()

  return (
    <>
      <Text color={theme.colors.primary} bold>
        Git Rake{restoreMode ? ' - Restore Mode' : ''}
      </Text>

      {children && (
        <>
          <Text color={theme.colors.text}> • </Text>
          {children}
        </>
      )}
    </>
  )
}
