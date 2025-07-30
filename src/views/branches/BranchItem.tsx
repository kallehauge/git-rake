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
  const branchNameColor = isSelected
    ? theme.colors.selection
    : branch.isCurrent
      ? theme.colors.primary
      : theme.colors.text

  const timeAgo = useMemo(
    () => getCompactTimeAgo(branch.lastCommitDate),
    [branch.lastCommitDate],
  )

  const statusInfo = useMemo(
    () => getBranchStatus(branch, theme.colors),
    [branch, theme.colors],
  )

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
        <Text
          color={branchNameColor}
          bold={branch.isCurrent}
          wrap="truncate-end"
        >
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
        <Text
          color={isSelected ? theme.colors.selection : theme.colors.secondary}
          wrap="truncate-end"
        >
          {timeAgo}
        </Text>
      </Box>

      <Box
        flexBasis="8%"
        flexShrink={2}
        marginRight={1}
        overflow="hidden"
        minWidth={0}
      >
        <Text
          color={isSelected ? theme.colors.selection : theme.colors.secondary}
          wrap="truncate-end"
        >
          {branch.lastCommitHash.substring(0, 7)}
        </Text>
      </Box>

      <Box
        flexBasis="12%"
        flexShrink={2}
        marginRight={1}
        overflow="hidden"
        minWidth={0}
      >
        <Text
          color={isSelected ? theme.colors.selection : theme.colors.secondary}
          wrap="truncate-end"
        >
          {branch.lastCommitAuthor || '—'}
        </Text>
      </Box>

      <Box width="40%" flexShrink={1} overflow="hidden" minWidth={0}>
        <Text
          color={isSelected ? theme.colors.selection : theme.colors.secondary}
          wrap="truncate-end"
        >
          {branch.lastCommitMessage}
        </Text>
      </Box>
    </Box>
  )
})
