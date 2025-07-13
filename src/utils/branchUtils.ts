import { GitBranch } from '../types/index.js';

export function getCompactTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
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
}

export function truncateCommitMessage(message: string, maxLength: number = 40): string {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.substring(0, maxLength - 3)}...`;
}

export function truncateBranchName(name: string, maxLength: number = 23): string {
  if (name.length <= maxLength) {
    return name;
  }
  return `${name.substring(0, maxLength - 3)}...`;
}

export function truncateAuthorName(name: string, maxLength: number = 10): string {
  if (!name) return '—';
  if (name.length <= maxLength) {
    return name;
  }
  return `${name.substring(0, maxLength - 1)}…`;
}

export interface BranchStatus {
  text: string;
  color: string;
}

export function getBranchStatus(branch: GitBranch, colors: any): BranchStatus {
  if (branch.isCurrent) {
    return { text: 'current', color: colors.primary };
  }

  if (branch.isMerged) {
    return { text: 'merged', color: colors.success };
  }

  if (branch.aheadBy !== undefined && branch.behindBy !== undefined) {
    if (branch.aheadBy === 0 && branch.behindBy === 0) {
      return { text: 'up-to-date', color: colors.success };
    }
    if (branch.aheadBy > 0 && branch.behindBy > 0) {
      return { text: `+${branch.aheadBy}/-${branch.behindBy}`, color: colors.warning };
    }
    if (branch.aheadBy > 0) {
      return { text: `+${branch.aheadBy}`, color: colors.success };
    }
    if (branch.behindBy > 0) {
      return { text: `-${branch.behindBy}`, color: colors.warning };
    }
  }

  if (branch.isStale) {
    return { text: 'stale', color: colors.warning };
  }

  return { text: 'unmerged', color: colors.error };
}

export function getSelectionIndicator(branch: GitBranch, isMarked: boolean, showSelection: boolean): string {
  if (branch.isCurrent) return 'x';
  if (!showSelection) return ' ';
  return isMarked ? '●' : '○';
}