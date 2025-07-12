import Fuse from 'fuse.js';
import { GitBranch, FilterOptions, FilterType } from '../types';

export function filterBranches(branches: GitBranch[], options: FilterOptions): GitBranch[] {
  return branches.filter(branch => {
    if (branch.isLocal && !options.showLocal) return false;
    if (branch.isRemote && !options.showRemote) return false;
    if (branch.isMerged && !options.showMerged) return false;
    if (!branch.isMerged && !options.showUnmerged) return false;
    if (branch.isStale && !options.showStale) return false;
    
    return true;
  });
}

export function getFilterOptionsForType(filterType: FilterType): FilterOptions {
  switch (filterType) {
    case 'all':
      return {
        showMerged: true,
        showUnmerged: true,
        showStale: true,
        showLocal: true,
        showRemote: false,
      };
    case 'merged':
      return {
        showMerged: true,
        showUnmerged: false,
        showStale: true,
        showLocal: true,
        showRemote: false,
      };
    case 'stale':
      return {
        showMerged: true,
        showUnmerged: true,
        showStale: true,
        showLocal: true,
        showRemote: false,
      };
    case 'unmerged':
      return {
        showMerged: false,
        showUnmerged: true,
        showStale: true,
        showLocal: true,
        showRemote: false,
      };
    default:
      return getFilterOptionsForType('all');
  }
}

export class BranchSearcher {
  private fuse: Fuse<GitBranch>;

  constructor(branches: GitBranch[]) {
    this.fuse = new Fuse(branches, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'lastCommitMessage', weight: 0.3 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }

  search(query: string): GitBranch[] {
    if (!query.trim()) {
      return [];
    }

    const results = this.fuse.search(query);
    return results.map(result => result.item);
  }

  updateBranches(branches: GitBranch[]): void {
    this.fuse.setCollection(branches);
  }
}

export function sortBranches(branches: GitBranch[]): GitBranch[] {
  return [...branches].sort((a, b) => {
    // Current branch first
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    
    // Then by last commit date (newest first)
    return b.lastCommitDate.getTime() - a.lastCommitDate.getTime();
  });
}