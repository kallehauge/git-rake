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
    >
      {/* Selection indicator space */}
      <Box width={3}>
        <Text color={theme.colors.secondary}> </Text>
      </Box>

      <Box width={25} marginRight={2}>
        <Text color={theme.colors.secondary} bold>
          BRANCH NAME
        </Text>
      </Box>

      <Box width={10} marginRight={1}>
        <Text color={theme.colors.secondary} bold>
          STATUS
        </Text>
      </Box>

      <Box width={8} marginRight={1}>
        <Text color={theme.colors.secondary} bold>
          AGE
        </Text>
      </Box>

      <Box width={8} marginRight={1}>
        <Text color={theme.colors.secondary} bold>
          COMMIT
        </Text>
      </Box>

      <Box width={12} marginRight={1}>
        <Text color={theme.colors.secondary} bold>
          AUTHOR
        </Text>
      </Box>

      <Box flexGrow={1}>
        <Text color={theme.colors.secondary} bold>
          MESSAGE
        </Text>
      </Box>
    </Box>
  )
}
