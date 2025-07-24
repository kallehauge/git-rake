import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useCallback,
} from 'react'
import { GitBranch } from '@services/GitRepository.js'
import {
  computeFilteredBranches,
  computeSelectedBranches,
  computeStatusBarInfo,
  computeCurrentBranch,
  StatusBarInfo,
} from '@utils/derivedState.js'
import { SearchContext } from './SearchContext.js'
import { SelectionContext } from './SelectionContext.js'

export type BranchContextData = {
  branches: GitBranch[]
  filteredBranches: GitBranch[]
  selectedBranches: GitBranch[]
  currentBranch: GitBranch | null
  statusBarInfo: StatusBarInfo
  refreshBranches: () => Promise<void>
  isRefreshing: boolean
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
  refreshBranches: async () => {},
  isRefreshing: false,
}

const BranchDataContext = createContext<BranchContextData>(defaultBranchData)

type BranchDataProviderProps = {
  children: ReactNode
  branches: GitBranch[]
  onRefreshBranches?: () => Promise<void>
}

export function BranchDataProvider({
  children,
  branches,
  onRefreshBranches,
}: BranchDataProviderProps) {
  const { searchQuery, filterType, searchMode } = useContext(SearchContext)
  const { selectedBranchNames, selectedIndex } = useContext(SelectionContext)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshBranches = useCallback(async () => {
    if (!onRefreshBranches) return

    try {
      setIsRefreshing(true)
      await onRefreshBranches()
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefreshBranches])

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
      refreshBranches,
      isRefreshing,
    }),
    [
      branches,
      filteredBranches,
      selectedBranches,
      currentBranch,
      statusBarInfo,
      refreshBranches,
      isRefreshing,
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
