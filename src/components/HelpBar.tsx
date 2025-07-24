import { Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'

type HelpBarProps = {
  helpText: string
  showExitWarning?: boolean
}

export function HelpBar({ helpText, showExitWarning }: HelpBarProps) {
  const { theme } = useAppUIContext()

  return (
    <>
      {showExitWarning ? (
        <Text color={theme.colors.warning}>Press Ctrl+C again to exit</Text>
      ) : (
        <Text color={theme.colors.muted}>{helpText} • ctrl+c: exit</Text>
      )}
    </>
  )
}
