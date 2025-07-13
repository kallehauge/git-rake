import { GitBranch, FilterType } from '../types/index.js';
import { BranchSearcher, getFilterOptionsForType, filterBranches, sortBranches } from './filters.js';
import { StatusBarInfo } from '../hooks/useDerivedState.js';

export function computeFilteredBranches(
  branches: GitBranch[],
  searchQuery: string,
  filterType: FilterType
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
  filterType: FilterType,
  totalBranches: number,
  filteredBranches: number,
  selectedCount: number,
  searchMode: boolean,
  searchInputActive: boolean,
  searchQuery: string
): StatusBarInfo {
  return {
    filterType,
    totalBranches,
    filteredBranches,
    selectedCount,
    searchMode,
    searchInputActive,
    searchQuery,
  };
}

export function computeCurrentBranch(
  filteredBranches: GitBranch[],
  selectedIndex: number
): GitBranch | null {
  return filteredBranches[selectedIndex] || null;
}