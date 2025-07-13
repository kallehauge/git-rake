import { Box, Text } from 'ink';
import { GitBranch } from '../types/index.js';
import { useTheme } from './ThemeProvider.js';

interface BranchItemProps {
  branch: GitBranch;
  isSelected: boolean;
  isMarked: boolean;
  showSelection: boolean;
}

export function BranchItem({ branch, isSelected, isMarked, showSelection }: BranchItemProps) {
  const { theme } = useTheme();


  const getSelectionIndicator = () => {
    if (branch.isCurrent) return 'x';
    if (!showSelection) return ' ';
    return isMarked ? '●' : '○';
  };

  const selectionIndicator = getSelectionIndicator();

  const textColor = isSelected ? 'white' : theme.colors.text;
  const branchNameColor = isSelected
    ? 'white'
    : branch.isCurrent
    ? theme.colors.primary
    : theme.colors.text;

  // More compact time formatting
  const getCompactTimeAgo = () => {
    const now = new Date();
    const diffInMs = now.getTime() - branch.lastCommitDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInMinutes < 5) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${diffInYears}y ago`;
  };

  const timeAgo = getCompactTimeAgo();

  // Better commit message truncation
  const getCommitMessage = () => {
    const maxLength = 40;
    if (branch.lastCommitMessage.length <= maxLength) {
      return branch.lastCommitMessage;
    }
    return `${branch.lastCommitMessage.substring(0, maxLength - 3)}...`;
  };

  const commitMessage = getCommitMessage();

  const getStatusText = () => {
    if (branch.isCurrent) {
      return { text: 'current', color: theme.colors.primary };
    }

    if (branch.isMerged) {
      return { text: 'merged', color: theme.colors.success };
    }

    if (branch.aheadBy !== undefined && branch.behindBy !== undefined) {
      if (branch.aheadBy === 0 && branch.behindBy === 0) {
        return { text: 'up-to-date', color: theme.colors.success };
      }
      if (branch.aheadBy > 0 && branch.behindBy > 0) {
        return { text: `+${branch.aheadBy}/-${branch.behindBy}`, color: theme.colors.warning };
      }
      if (branch.aheadBy > 0) {
        return { text: `+${branch.aheadBy}`, color: theme.colors.success };
      }
      if (branch.behindBy > 0) {
        return { text: `-${branch.behindBy}`, color: theme.colors.warning };
      }
    }

    if (branch.isStale) {
      return { text: 'stale', color: theme.colors.warning };
    }

    return { text: 'unmerged', color: theme.colors.error };
  };

  return (
    <Box paddingX={1} paddingY={0}>
      {/* Selection indicator */}
      <Box width={3}>
        <Text color={textColor}>{selectionIndicator}</Text>
      </Box>

      {/* Branch name - fixed width with proper truncation */}
      <Box width={25} marginRight={2}>
        <Text color={branchNameColor} bold={branch.isCurrent}>
          {branch.name.length > 23 ? `${branch.name.substring(0, 20)}...` : branch.name}
        </Text>
      </Box>

      {/* Status (ahead/behind or merged status) */}
      <Box width={10} marginRight={1}>
        <Text color={isSelected ? 'white' : getStatusText().color}>
          {getStatusText().text}
        </Text>
      </Box>

      {/* Time ago - compact format */}
      <Box width={8} marginRight={1}>
        <Text color={isSelected ? 'white' : theme.colors.secondary}>
          {timeAgo}
        </Text>
      </Box>

      {/* Commit hash */}
      <Box width={8} marginRight={1}>
        <Text color={isSelected ? 'white' : theme.colors.secondary}>
          {branch.lastCommitHash.substring(0, 7)}
        </Text>
      </Box>

      {/* Author */}
      <Box width={12} marginRight={1}>
        <Text color={isSelected ? 'white' : theme.colors.secondary}>
          {branch.lastCommitAuthor
            ? (branch.lastCommitAuthor.length > 10
              ? `${branch.lastCommitAuthor.substring(0, 9)}…`
              : branch.lastCommitAuthor)
            : '—'}
        </Text>
      </Box>

      {/* Commit message - moved to far right */}
      <Box flexGrow={1}>
        <Text color={isSelected ? 'white' : theme.colors.secondary}>
          {commitMessage}
        </Text>
      </Box>
    </Box>
  );
}