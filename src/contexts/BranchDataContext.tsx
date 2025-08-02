import { createContext, useContext, ReactNode, useMemo } from 'react'
import type { GitBranch } from '@services/GitRepository.types.js'
import type { BranchFilter } from '@utils/filters.types.js'
import {
  getFilterOptionsForType,
  filterBranches,
  BranchSearcher,
} from '@utils/filters.js'
import { SearchContext } from './SearchContext.js'
import { SelectionContext } from './SelectionContext.js'

type StatusBarInfo = {
  filterType: BranchFilter
  totalBranches: number
  filteredBranches: number
  selectedCount: number
  searchMode: boolean
  searchQuery: string
}

type BranchContextData = {
  branches: GitBranch[]
  filteredBranches: GitBranch[]
  selectedBranches: GitBranch[]
  currentBranch: GitBranch | null
  statusBarInfo: StatusBarInfo
}

function computeFilteredBranches(
  branches: GitBranch[],
  searchQuery: string,
  filterType: BranchFilter,
): GitBranch[] {
  const filterOptions = getFilterOptionsForType(filterType)
  let filteredBranches = filterBranches(branches, filterOptions)

  if (searchQuery.trim()) {
    const searcher = new BranchSearcher(filteredBranches)
    filteredBranches = searcher.search(searchQuery)
  }

  return filteredBranches
}

function computeSelectedBranches(
  branches: GitBranch[],
  selectedBranchNames: Set<string>,
): GitBranch[] {
  return Array.from(selectedBranchNames)
    .map(name => branches.find(b => b.name === name))
    .filter(Boolean) as GitBranch[]
}

function computeStatusBarInfo(
  filterType: BranchFilter,
  totalBranches: number,
  filteredBranches: number,
  selectedCount: number,
  searchMode: boolean,
  searchQuery: string,
): StatusBarInfo {
  return {
    filterType,
    totalBranches,
    filteredBranches,
    selectedCount,
    searchMode,
    searchQuery,
  }
}

function computeCurrentBranch(
  filteredBranches: GitBranch[],
  selectedIndex: number,
): GitBranch | null {
  return filteredBranches[selectedIndex] || null
}

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
