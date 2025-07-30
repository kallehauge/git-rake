import React, { useMemo } from 'react'
import { Box, Text } from 'ink'
import type { GitBranch } from '@services/GitRepository.types.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import type { BranchesListLayout } from './hooks/useBranchesListLayout.js'
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
  columnLayout: BranchesListLayout
}

export const BranchItem = React.memo(function BranchItem({
  branch,
  isSelected,
  isMarked,
  showSelection,
  columnLayout,
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
      <Box {...columnLayout.selection.styles}>
        <Text color={textColor}>{selectionIndicator}</Text>
      </Box>

      <Box {...columnLayout.branchName.styles}>
        <Text color={textColor} wrap="truncate-end">
          {branch.name}
        </Text>
      </Box>

      {columnLayout.status.visible && (
        <Box {...columnLayout.status.styles}>
          <Text
            color={isSelected ? theme.colors.selection : statusInfo.color}
            wrap="truncate-end"
          >
            {statusInfo.text}
          </Text>
        </Box>
      )}

      {columnLayout.updated.visible && (
        <Box {...columnLayout.updated.styles}>
          <Text color={textColor} wrap="truncate-end">
            {timeAgo}
          </Text>
        </Box>
      )}

      {columnLayout.upstream.visible && (
        <Box {...columnLayout.upstream.styles}>
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
      )}

      {columnLayout.lastCommit.visible && (
        <Box {...columnLayout.lastCommit.styles}>
          <Text color={textColor} wrap="truncate-end">
            {branch.lastCommitMessage}
          </Text>
        </Box>
      )}
    </Box>
  )
})
