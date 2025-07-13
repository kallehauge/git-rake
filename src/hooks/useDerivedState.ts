import { useMemo } from 'react';
import { GitBranch, FilterType } from '../types/index.js';
import { computeFilteredBranches, computeSelectedBranches, computeStatusBarInfo, computeCurrentBranch } from '../utils/derivedState.js';

export function useFilteredBranches(
  branches: GitBranch[],
  searchQuery: string,
  filterType: FilterType
): GitBranch[] {
  return useMemo(() => {
    return computeFilteredBranches(branches, searchQuery, filterType);
  }, [branches, searchQuery, filterType]);
}

export function useSelectedBranches(
  branches: GitBranch[],
  selectedBranchNames: Set<string>
): GitBranch[] {
  return useMemo(() => {
    return computeSelectedBranches(branches, selectedBranchNames);
  }, [branches, selectedBranchNames]);
}

export function useCurrentBranch(
  filteredBranches: GitBranch[],
  selectedIndex: number
): GitBranch | null {
  return useMemo(() => {
    const validatedIndex = Math.max(0, Math.min(selectedIndex, filteredBranches.length - 1));
    return computeCurrentBranch(filteredBranches, validatedIndex);
  }, [filteredBranches, selectedIndex]);
}

export function useValidatedSelectedIndex(
  selectedIndex: number,
  filteredBranchesLength: number
): number {
  return useMemo(() => {
    return Math.max(0, Math.min(selectedIndex, filteredBranchesLength - 1));
  }, [selectedIndex, filteredBranchesLength]);
}

export interface StatusBarInfo {
  filterType: FilterType;
  totalBranches: number;
  filteredBranches: number;
  selectedCount: number;
  searchMode: boolean;
  searchInputActive: boolean;
  searchQuery: string;
}

export function useStatusBarInfo(
  filterType: FilterType,
  totalBranches: number,
  filteredBranches: number,
  selectedCount: number,
  searchMode: boolean,
  searchInputActive: boolean,
  searchQuery: string
): StatusBarInfo {
  return useMemo(() => {
    return computeStatusBarInfo(
      filterType,
      totalBranches,
      filteredBranches,
      selectedCount,
      searchMode,
      searchInputActive,
      searchQuery
    );
  }, [filterType, totalBranches, filteredBranches, selectedCount, searchMode, searchInputActive, searchQuery]);
}