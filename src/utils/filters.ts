import Fuse from 'fuse.js'
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

export class BranchSearcher {
  private fuse: Fuse<GitBranch>
  constructor(branches: GitBranch[]) {
    this.fuse = new Fuse(branches, {
      keys: [{ name: 'name', weight: 1 }],
    })
  }

  search(query: string): GitBranch[] {
    if (!query.trim()) {
      return []
    }

    const results = this.fuse.search(query)
    return results.map(result => result.item)
  }

  updateBranches(branches: GitBranch[]): void {
    this.fuse.setCollection(branches)
  }
}
