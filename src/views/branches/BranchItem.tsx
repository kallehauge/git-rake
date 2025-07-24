import React, { useMemo } from 'react'
import { Box, Text } from 'ink'
import { GitBranch } from '@services/GitRepository.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import {
  getCompactTimeAgo,
  truncateCommitMessage,
  truncateBranchName,
  truncateAuthorName,
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

  const commitMessage = useMemo(
    () => truncateCommitMessage(branch.lastCommitMessage),
    [branch.lastCommitMessage],
  )

  const branchName = useMemo(
    () => truncateBranchName(branch.name),
    [branch.name],
  )

  const authorName = useMemo(
    () => truncateAuthorName(branch.lastCommitAuthor || ''),
    [branch.lastCommitAuthor],
  )

  const statusInfo = useMemo(
    () => getBranchStatus(branch, theme.colors),
    [branch, theme.colors],
  )

  return (
    <Box paddingX={1} paddingY={0}>
      <Box width={3}>
        <Text color={textColor}>{selectionIndicator}</Text>
      </Box>

      <Box width={25} marginRight={2}>
        <Text color={branchNameColor} bold={branch.isCurrent}>
          {branchName}
        </Text>
      </Box>

      <Box width={10} marginRight={1}>
        <Text color={isSelected ? theme.colors.selection : statusInfo.color}>
          {statusInfo.text}
        </Text>
      </Box>

      <Box width={8} marginRight={1}>
        <Text
          color={isSelected ? theme.colors.selection : theme.colors.secondary}
        >
          {timeAgo}
        </Text>
      </Box>

      <Box width={8} marginRight={1}>
        <Text
          color={isSelected ? theme.colors.selection : theme.colors.secondary}
        >
          {branch.lastCommitHash.substring(0, 7)}
        </Text>
      </Box>

      <Box width={12} marginRight={1}>
        <Text
          color={isSelected ? theme.colors.selection : theme.colors.secondary}
        >
          {authorName}
        </Text>
      </Box>

      <Box flexGrow={1}>
        <Text
          color={isSelected ? theme.colors.selection : theme.colors.secondary}
        >
          {commitMessage}
        </Text>
      </Box>
    </Box>
  )
})
