import React, { useMemo } from 'react'
import { Box, Text } from 'ink'
import type { GitBranch } from '@services/GitRepository.types.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import {
  getCompactTimeAgo,
  getBranchStatus,
  getSelectionIndicator,
} from '@utils/branchUtils.js'

type BranchItemProps = {
  branch: GitBranch
  isSelected: boolean
  isMarked: boolean
  showSelection: boolean
}

export const BranchItem = React.memo(function BranchItem({
  branch,
  isSelected,
  isMarked,
  showSelection,
}: BranchItemProps) {
  const { theme } = useAppUIContext()

  const selectionIndicator = useMemo(
    () => getSelectionIndicator(branch, isMarked, showSelection),
    [branch, isMarked, showSelection],
  )

  const textColor = isSelected ? theme.colors.selection : theme.colors.text

  const timeAgo = useMemo(
    () => getCompactTimeAgo(branch.lastCommitDate),
    [branch.lastCommitDate],
  )

  const statusInfo = useMemo(
    () => getBranchStatus(branch, theme),
    [branch, theme],
  )

  const getUpstreamStatusText = (
    status: string | null,
  ): { text: string; color: string } => {
    if (status === null) return { text: '—', color: theme.colors.secondary }

    switch (status) {
      case '>':
        return { text: 'ahead', color: theme.colors.success }
      case '<':
        return { text: 'behind', color: theme.colors.warning }
      case '<>':
        return { text: 'diverged', color: theme.colors.error }
      case '=':
        return { text: 'in sync', color: theme.colors.success }
      case '[gone]':
        return { text: 'gone', color: theme.colors.error }
      default:
        return { text: '—', color: theme.colors.secondary }
    }
  }

  return (
    <Box paddingX={1} paddingY={0} overflow="hidden" width="100%">
      <Box width={3} flexShrink={0} minWidth={0}>
        <Text color={textColor}>{selectionIndicator}</Text>
      </Box>

      <Box
        flexBasis="25%"
        flexShrink={0}
        marginRight={2}
        overflow="hidden"
        minWidth={0}
      >
        <Text color={textColor} wrap="truncate-end">
          {branch.name}
        </Text>
      </Box>

      <Box
        flexBasis="10%"
        flexShrink={2}
        marginRight={1}
        overflow="hidden"
        minWidth={0}
      >
        <Text
          color={isSelected ? theme.colors.selection : statusInfo.color}
          wrap="truncate-end"
        >
          {statusInfo.text}
        </Text>
      </Box>

      <Box
        flexBasis="8%"
        flexShrink={2}
        marginRight={1}
        overflow="hidden"
        minWidth={0}
      >
        <Text color={textColor} wrap="truncate-end">
          {timeAgo}
        </Text>
      </Box>

      <Box
        flexBasis="10%"
        flexShrink={2}
        marginRight={1}
        overflow="hidden"
        minWidth={0}
      >
        <Text
          color={
            isSelected
              ? theme.colors.selection
              : getUpstreamStatusText(branch.upstreamTrackShort).color
          }
          wrap="truncate-end"
        >
          {getUpstreamStatusText(branch.upstreamTrackShort).text}
        </Text>
      </Box>

      <Box width="48%" flexShrink={1} overflow="hidden" minWidth={0}>
        <Text color={textColor} wrap="truncate-end">
          {branch.lastCommitMessage}
        </Text>
      </Box>
    </Box>
  )
})
