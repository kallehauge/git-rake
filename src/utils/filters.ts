import type { GitBranch } from '@services/GitRepository.types.js'
import type { BranchFilter } from './filters.types.js'

type BranchFilterOptions = {
  showMerged: boolean
  showUnmerged: boolean
  showStale: boolean
  showLocal: boolean
  showRemote: boolean
}

export function filterBranches(
  branches: GitBranch[],
  options: BranchFilterOptions,
): GitBranch[] {
  return branches.filter(branch => {
    if (!branch.isRemote && !options.showLocal) return false
    if (branch.isRemote && !options.showRemote) return false
    if (branch.isMerged && !options.showMerged) return false
    if (!branch.isMerged && !options.showUnmerged) return false
    if (branch.isStale && !options.showStale) return false

    return true
  })
}

export function getFilterOptionsForType(
  filterType: BranchFilter,
): BranchFilterOptions {
  switch (filterType) {
    case 'all':
      return {
        showMerged: true,
        showUnmerged: true,
        showStale: true,
        showLocal: true,
        showRemote: false,
      }
    case 'merged':
      return {
        showMerged: true,
        showUnmerged: false,
        showStale: true,
        showLocal: true,
        showRemote: false,
      }
    case 'stale':
      return {
        showMerged: true,
        showUnmerged: true,
        showStale: true,
        showLocal: true,
        showRemote: false,
      }
    case 'unmerged':
      return {
        showMerged: false,
        showUnmerged: true,
        showStale: true,
        showLocal: true,
        showRemote: false,
      }
    default:
      return getFilterOptionsForType('all')
  }
}

export function getFilterDisplayText(filter: BranchFilter): string {
  switch (filter) {
    case 'all':
      return 'All'
    case 'merged':
      return 'Merged'
    case 'stale':
      return 'Stale'
    case 'unmerged':
      return 'Unmerged'
    case 'selected':
      return 'Selected'
    default:
      return 'All'
  }
}

export function searchBranches(
  branches: GitBranch[],
  query: string,
): GitBranch[] {
  if (!query.trim()) {
    return branches
  }

  const lowerQuery = query.toLowerCase()
  return branches.filter(branch =>
    branch.name.toLowerCase().includes(lowerQuery),
  )
}
