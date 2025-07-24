import { createContext, useContext, ReactNode, useMemo } from 'react'
import type { BranchContextData } from './BranchDataContext.types.js'
import type { GitBranch } from '@services/GitRepository.types.js'
import {
  computeFilteredBranches,
  computeSelectedBranches,
  computeStatusBarInfo,
  computeCurrentBranch,
} from '@utils/derivedState.js'
import { SearchContext } from './SearchContext.js'
import { SelectionContext } from './SelectionContext.js'

const defaultBranchData: BranchContextData = {
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
    searchQuery: '',
  },
}

const BranchDataContext = createContext<BranchContextData>(defaultBranchData)

type BranchDataProviderProps = {
  children: ReactNode
  branches: GitBranch[]
}

export function BranchDataProvider({
  children,
  branches,
}: BranchDataProviderProps) {
  const { searchQuery, filterType, searchMode } = useContext(SearchContext)
  const { selectedBranchNames, selectedIndex } = useContext(SelectionContext)

  const filteredBranches = useMemo(() => {
    return computeFilteredBranches(branches, searchQuery, filterType)
  }, [branches, searchQuery, filterType])

  const selectedBranches = useMemo(() => {
    return computeSelectedBranches(branches, selectedBranchNames)
  }, [branches, selectedBranchNames])

  const validatedSelectedIndex = useMemo(() => {
    return Math.max(0, Math.min(selectedIndex, filteredBranches.length - 1))
  }, [selectedIndex, filteredBranches.length])

  const currentBranch = useMemo(() => {
    return computeCurrentBranch(filteredBranches, validatedSelectedIndex)
  }, [filteredBranches, validatedSelectedIndex])

  const statusBarInfo = useMemo(() => {
    return computeStatusBarInfo(
      filterType,
      branches.length,
      filteredBranches.length,
      selectedBranches.length,
      searchMode,
      searchQuery,
    )
  }, [
    filterType,
    branches.length,
    filteredBranches.length,
    selectedBranches.length,
    searchMode,
    searchQuery,
  ])

  const branchData: BranchContextData = useMemo(
    () => ({
      branches,
      filteredBranches,
      selectedBranches,
      currentBranch,
      statusBarInfo,
    }),
    [
      branches,
      filteredBranches,
      selectedBranches,
      currentBranch,
      statusBarInfo,
    ],
  )

  return (
    <BranchDataContext.Provider value={branchData}>
      {children}
    </BranchDataContext.Provider>
  )
}

export function useBranchDataContext() {
  return useContext(BranchDataContext)
}
