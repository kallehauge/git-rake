import { useMemo } from 'react'
import { GitBranch } from '@services/GitRepository.js'
import { AppTheme } from '@utils/themes/index.js'
import { BranchFilter } from '@utils/filters.js'
import { StatusBarInfo } from '@utils/derivedState.js'
import { UIOperationType } from './useBranchesOperations.js'

interface UseBranchesDisplayProps {
  pendingOperation: UIOperationType | null
  selectedBranches: GitBranch[]
  contextFilteredBranches: GitBranch[]
  statusBarInfo: StatusBarInfo
  branches: GitBranch[]
  theme: AppTheme
}

interface BranchesStatusBarProps {
  selectedCount: number
  filteredCount: number
  totalBranches: number
  filterDisplay: string
  searchMode: boolean
  searchQuery: string
  showSearch: boolean
  theme: AppTheme
}

interface UseBranchesDisplayReturn {
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

export type { BranchesStatusBarProps }
