import { useMemo } from 'react'
import type { GitBranch } from '@services/GitRepository.types.js'
import type { AppTheme } from '@utils/themes/themes.types.js'
import type { BranchFilter } from '@utils/filters.types.js'
import type { UIOperationType } from '../types.js'

type UseBranchesDisplayProps = {
  pendingOperation: UIOperationType | null
  selectedBranches: GitBranch[]
  contextFilteredBranches: GitBranch[]
  statusBarInfo: {
    filterType: BranchFilter
    totalBranches: number
    filteredBranches: number
    selectedCount: number
    searchMode: boolean
    searchQuery: string
  }
  branches: GitBranch[]
  theme: AppTheme
}

type BranchesStatusBarProps = {
  selectedCount: number
  filteredCount: number
  totalBranches: number
  filterDisplay: string
  searchMode: boolean
  searchQuery: string
  showSearch: boolean
  theme: AppTheme
}

type UseBranchesDisplayReturn = {
  branchesToDisplay: GitBranch[]
  statusBarProps: BranchesStatusBarProps
}

function getFilterDisplayText(filter: BranchFilter): string {
  switch (filter) {
    case 'all':
      return 'All'
    case 'merged':
      return 'Merged'
    case 'stale':
      return 'Stale'
    case 'unmerged':
      return 'Unmerged'
    default:
      return 'All'
  }
}

export function useBranchesDisplay({
  pendingOperation,
  selectedBranches,
  contextFilteredBranches,
  statusBarInfo,
  branches,
  theme,
}: UseBranchesDisplayProps): UseBranchesDisplayReturn {
  // Determine which branches to display based on if the user is navigating around
  // and selecting branches to do an action on.
  // If the user choose to do an action, we replace the navigation with all of the selected branches.
  const branchesToDisplay = useMemo(() => {
    return pendingOperation ? selectedBranches : contextFilteredBranches
  }, [pendingOperation, selectedBranches, contextFilteredBranches])

  // Compute the filter display text based on current state
  const filterDisplay = pendingOperation
    ? 'Selected'
    : getFilterDisplayText(statusBarInfo.filterType)

  // Compute all status bar props
  const statusBarProps = useMemo(
    (): BranchesStatusBarProps => ({
      selectedCount: statusBarInfo.selectedCount,
      filteredCount: branchesToDisplay.length,
      totalBranches: branches.length,
      filterDisplay,
      searchMode: statusBarInfo.searchMode,
      searchQuery: statusBarInfo.searchQuery,
      showSearch: !pendingOperation, // Hide search during confirmation
      theme,
    }),
    [
      statusBarInfo.selectedCount,
      statusBarInfo.searchMode,
      statusBarInfo.searchQuery,
      branchesToDisplay.length,
      branches.length,
      filterDisplay,
      pendingOperation,
      theme,
    ],
  )

  return {
    branchesToDisplay,
    statusBarProps,
  }
}
