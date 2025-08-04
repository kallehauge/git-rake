import { ReactNode } from 'react'
import { Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'

type StatusBarProps = {
  children?: ReactNode
  title: string
}

export function StatusBar({ children, title }: StatusBarProps) {
  const { theme } = useAppUIContext()

  return (
    <>
      <Text color={theme.colors.primary} bold>
        {title}
      </Text>

      {children && (
        <>
          <Text> • </Text>
          {children}
        </>
      )}
    </>
  )
}
