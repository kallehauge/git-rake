import { Box, Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import type { BranchesListLayout } from './types.js'

type BranchesListHeaderProps = {
  columnLayout: BranchesListLayout
}

export function BranchesListHeader({ columnLayout }: BranchesListHeaderProps) {
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
      <Box {...columnLayout.selection.styles}>
        <Text color={theme.colors.secondary}> </Text>
      </Box>

      <Box {...columnLayout.branchName.styles}>
        <Text color={theme.colors.secondary} bold wrap="truncate-end">
          BRANCH NAME
        </Text>
      </Box>

      {columnLayout.status.visible && (
        <Box {...columnLayout.status.styles}>
          <Text color={theme.colors.secondary} bold wrap="truncate-end">
            STATUS
          </Text>
        </Box>
      )}

      {columnLayout.updated.visible && (
        <Box {...columnLayout.updated.styles}>
          <Text color={theme.colors.secondary} bold wrap="truncate-end">
            UPDATED
          </Text>
        </Box>
      )}

      {columnLayout.upstream.visible && (
        <Box {...columnLayout.upstream.styles}>
          <Text color={theme.colors.secondary} bold wrap="truncate-end">
            UPSTREAM
          </Text>
        </Box>
      )}

      {columnLayout.lastCommit.visible && (
        <Box {...columnLayout.lastCommit.styles}>
          <Text color={theme.colors.secondary} bold wrap="truncate-end">
            LAST COMMIT
          </Text>
        </Box>
      )}
    </Box>
  )
}
