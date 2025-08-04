import type { GitBranch } from '@services/GitRepository.types.js'
import type { AppTheme } from '@utils/themes/themes.types.js'
import type { BranchFilter } from './filters.types.js'
import {
  getFilterOptionsForType,
  filterBranches,
  BranchSearcher,
} from './filters.js'

export function getCompactTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  if (diffInMinutes < 5) return 'now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`
  if (diffInMonths < 12) return `${diffInMonths}mo ago`
  return `${diffInYears}y ago`
}

type BranchStatus = {
  text: string
  color: string
}

export function getBranchStatus(
  branch: GitBranch,
  theme: AppTheme,
): BranchStatus {
  if (branch.isMerged) {
    return { text: 'merged', color: theme.colors.error }
  }

  if (branch.isStale) {
    return { text: 'stale', color: theme.colors.warning }
  }

  return { text: 'unmerged', color: theme.colors.text }
}

export function getSelectionIndicator(
  branch: GitBranch,
  isMarked: boolean,
  showSelection: boolean,
): string {
  if (branch.isCurrent) return 'x'
  if (!showSelection) return ' '
  return isMarked ? '●' : '○'
}

export function getFilteredBranches(
  branches: GitBranch[],
  selectedBranches: GitBranch[],
  searchQuery: string,
  filterType: BranchFilter,
): GitBranch[] {
  // Early bail for selection filter - shows user-selected branches
  if (filterType === 'selected') {
    return selectedBranches
  }

  // Property-based filtering for all other filter types
  const filterOptions = getFilterOptionsForType(filterType)
  let filteredBranches = filterBranches(branches, filterOptions)

  // Apply search within filtered results
  if (searchQuery.trim()) {
    const searcher = new BranchSearcher(filteredBranches)
    filteredBranches = searcher.search(searchQuery)
  }

  return filteredBranches
}
