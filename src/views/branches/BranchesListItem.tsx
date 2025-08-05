import React, { useMemo } from 'react'
import { Box, Text } from 'ink'
import type { GitBranch } from '@services/GitRepository.types.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import type { BranchesListLayout } from './types.js'
import {
  getCompactTimeAgo,
  getBranchStatus,
  getSelectionIndicator,
} from '@utils/branchUtils.js'

type BranchesListItemProps = {
  branch: GitBranch
  isSelected: boolean
  isMarked: boolean
  showSelection: boolean
  columnLayout: BranchesListLayout
}

export const BranchesListItem = React.memo(function BranchesListItem({
  branch,
  isSelected,
  isMarked,
  showSelection,
  columnLayout,
}: BranchesListItemProps) {
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
    if (status === null) return { text: '—', color: textColor }

    switch (status) {
      case '>':
        return { text: 'ahead', color: theme.colors.success }
      case '<':
        return { text: 'behind', color: theme.colors.warning }
      case '<>':
        return { text: 'diverged', color: theme.colors.alert }
      case '=':
        return { text: 'in sync', color: theme.colors.success }
      case '[gone]':
        return { text: 'gone', color: theme.colors.alert }
      default:
        return { text: '—', color: theme.colors.primary }
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
            color={isSelected ? textColor : statusInfo.color}
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
                ? textColor
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
