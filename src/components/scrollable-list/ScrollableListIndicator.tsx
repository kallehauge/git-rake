import { Box, Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'

type ScrollableListIndicatorProps = {
  currentIndex: number
  totalItems: number
  hasMoreAbove: boolean
  hasMoreBelow: boolean
}

export function ScrollableListIndicator({
  currentIndex,
  totalItems,
  hasMoreAbove,
  hasMoreBelow,
}: ScrollableListIndicatorProps) {
  const { theme } = useAppUIContext()
  return (
    <Box justifyContent="center" marginTop={1}>
      <Text color={theme.colors.selection}>
        {currentIndex + 1} of {totalItems} items
        {hasMoreAbove && ' (↑ more above)'}
        {hasMoreBelow && ' (↓ more below)'}
      </Text>
    </Box>
  )
}
