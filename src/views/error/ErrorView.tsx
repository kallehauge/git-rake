import { Box, Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { ViewLayout } from '@views/app/ViewLayout.js'

type ErrorViewProps = {
  error: string
  currentPath: string
}

export function ErrorView({ error, currentPath }: ErrorViewProps) {
  const { theme } = useAppUIContext()
  const helpText = 'ESC: exit • Ctrl+C: force exit'

  const statusBarContent = (
    <Text color={theme.colors.error} bold>
      Error
    </Text>
  )

  return (
    <ViewLayout
      statusBarContent={statusBarContent}
      helpText={helpText}
      currentPath={currentPath}
    >
      <Box flexDirection="column" padding={1}>
        <Text color={theme.colors.error}>Error: {error}</Text>
      </Box>
    </ViewLayout>
  )
}
