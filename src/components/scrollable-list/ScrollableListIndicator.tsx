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

  let moreIndicator = ''
  if (hasMoreAbove && hasMoreBelow) {
    moreIndicator = ' (↑/↓)'
  } else if (hasMoreAbove) {
    moreIndicator = ' (↑)'
  } else if (hasMoreBelow) {
    moreIndicator = ' (↓)'
  }

  return (
    <Box justifyContent="center" marginTop={1}>
      <Text color={theme.colors.selection}>
        {currentIndex + 1} of {totalItems} items{moreIndicator}
      </Text>
    </Box>
  )
}
