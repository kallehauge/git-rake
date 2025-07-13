import { createContext, useContext, ReactNode, useMemo } from 'react';
import { GitBranch } from '../types/index.js';
import {
  useFilteredBranches,
  useSelectedBranches,
  useCurrentBranch,
  useValidatedSelectedIndex,
  useStatusBarInfo,
  StatusBarInfo
} from '../hooks/useDerivedState.js';
import { SearchContext } from './SearchContext.js';
import { SelectionContext } from './SelectionContext.js';

export interface BranchData {
  branches: GitBranch[];
  filteredBranches: GitBranch[];
  selectedBranches: GitBranch[];
  currentBranch: GitBranch | null;
  statusBarInfo: StatusBarInfo;
}

const defaultBranchData: BranchData = {
  branches: [],
  filteredBranches: [],
  selectedBranches: [],
  currentBranch: null,
  statusBarInfo: {
    filterType: 'all',
    totalBranches: 0,
    filteredBranches: 0,
    selectedCount: 0,
    searchMode: false,
    searchInputActive: false,
    searchQuery: '',
  },
};

const BranchDataContext = createContext<BranchData>(defaultBranchData);

interface BranchDataProviderProps {
  children: ReactNode;
  branches: GitBranch[];
}

export function BranchDataProvider({ children, branches }: BranchDataProviderProps) {
  const { searchQuery, filterType, searchMode, searchInputActive } = useContext(SearchContext);
  const { selectedBranchNames, selectedIndex } = useContext(SelectionContext);

  const filteredBranches = useFilteredBranches(branches, searchQuery, filterType);
  const selectedBranches = useSelectedBranches(branches, selectedBranchNames);
  const validatedSelectedIndex = useValidatedSelectedIndex(selectedIndex, filteredBranches.length);
  const currentBranch = useCurrentBranch(filteredBranches, validatedSelectedIndex);

  const statusBarInfo = useStatusBarInfo(
    filterType,
    branches.length,
    filteredBranches.length,
    selectedBranches.length,
    searchMode,
    searchInputActive,
    searchQuery
  );

  const branchData: BranchData = useMemo(() => ({
    branches,
    filteredBranches,
    selectedBranches,
    currentBranch,
    statusBarInfo,
  }), [branches, filteredBranches, selectedBranches, currentBranch, statusBarInfo]);

  return (
    <BranchDataContext.Provider value={branchData}>
      {children}
    </BranchDataContext.Provider>
  );
}

export function useBranchDataContext() {
  return useContext(BranchDataContext);
}
