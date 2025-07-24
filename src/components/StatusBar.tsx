import { ReactNode } from 'react'
import { Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'

type StatusBarProps = {
  children?: ReactNode
  restoreMode?: boolean
}

export function StatusBar({ children, restoreMode = false }: StatusBarProps) {
  const { theme } = useAppUIContext()

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
