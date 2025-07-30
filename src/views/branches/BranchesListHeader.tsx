import { Box, Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'

export function BranchesListHeader() {
  const { theme } = useAppUIContext()

  return (
    <Box
      paddingX={1}
      paddingY={0}
      borderBottom={true}
      borderColor={theme.colors.border}
      flexShrink={0}
      overflow="hidden"
      width="100%"
    >
      {/* Selection indicator space */}
      <Box width={3} flexShrink={0} minWidth={0}>
        <Text color={theme.colors.secondary}> </Text>
      </Box>

      <Box
        flexBasis="25%"
        flexShrink={0}
        marginRight={2}
        overflow="hidden"
        minWidth={0}
      >
        <Text color={theme.colors.secondary} bold wrap="truncate-end">
          BRANCH NAME
        </Text>
      </Box>

      <Box
        flexBasis="10%"
        flexShrink={2}
        marginRight={1}
        overflow="hidden"
        minWidth={0}
      >
        <Text color={theme.colors.secondary} bold wrap="truncate-end">
          STATUS
        </Text>
      </Box>

      <Box
        flexBasis="8%"
        flexShrink={2}
        marginRight={1}
        overflow="hidden"
        minWidth={0}
      >
        <Text color={theme.colors.secondary} bold wrap="truncate-end">
          UPDATED
        </Text>
      </Box>

      <Box
        flexBasis="10%"
        flexShrink={2}
        marginRight={1}
        overflow="hidden"
        minWidth={0}
      >
        <Text color={theme.colors.secondary} bold wrap="truncate-end">
          UPSTREAM
        </Text>
      </Box>

      <Box width="48%" flexShrink={1} overflow="hidden" minWidth={0}>
        <Text color={theme.colors.secondary} bold wrap="truncate-end">
          LAST COMMIT
        </Text>
      </Box>
    </Box>
  )
}
