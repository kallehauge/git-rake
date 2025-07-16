import { GitBranch } from '@services/GitRepository.js';
import { BranchFilter } from '@utils/filters.js';
import { BranchSearcher, getFilterOptionsForType, filterBranches, sortBranches } from './filters.js';

export interface StatusBarInfo {
  filterType: BranchFilter;
  totalBranches: number;
  filteredBranches: number;
  selectedCount: number;
  searchMode: boolean;
  searchQuery: string;
}

export function computeFilteredBranches(
  branches: GitBranch[],
  searchQuery: string,
  filterType: BranchFilter
): GitBranch[] {
  let filteredBranches = branches;

  if (searchQuery.trim()) {
    const searcher = new BranchSearcher(branches);
    filteredBranches = searcher.search(searchQuery);
  } else {
    const filterOptions = getFilterOptionsForType(filterType);
    filteredBranches = filterBranches(branches, filterOptions);
  }

  return sortBranches(filteredBranches);
}

export function computeSelectedBranches(
  branches: GitBranch[],
  selectedBranchNames: Set<string>
): GitBranch[] {
  return Array.from(selectedBranchNames)
    .map(name => branches.find(b => b.name === name))
    .filter(Boolean) as GitBranch[];
}

export function computeStatusBarInfo(
  filterType: BranchFilter,
  totalBranches: number,
  filteredBranches: number,
  selectedCount: number,
  searchMode: boolean,
  searchQuery: string
): StatusBarInfo {
  return {
    filterType,
    totalBranches,
    filteredBranches,
    selectedCount,
    searchMode,
    searchQuery,
  };
}

export function computeCurrentBranch(
  filteredBranches: GitBranch[],
  selectedIndex: number
): GitBranch | null {
  return filteredBranches[selectedIndex] || null;
}
