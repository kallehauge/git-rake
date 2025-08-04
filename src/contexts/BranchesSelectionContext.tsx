import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useMemo,
  useCallback,
} from 'react'
import type { GitBranch } from '@services/GitRepository.types.js'
import type { SelectedBranches } from '@views/branches/types.js'

type BranchesSelectionContextState = {
  branches: GitBranch[]
  selectedBranches: SelectedBranches
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  setSelectedBranches: (branches: SelectedBranches) => void
  toggleSelectedBranch: (branch: GitBranch) => void
}

const defaultBranchesSelectionState: BranchesSelectionContextState = {
  branches: [],
  selectedBranches: new Map(),
  selectedIndex: 0,
  setSelectedIndex: () => {},
  setSelectedBranches: () => {},
  toggleSelectedBranch: () => {},
}

const BranchesSelectionContext = createContext<BranchesSelectionContextState>(
  defaultBranchesSelectionState,
)

type BranchesSelectionProviderProps = {
  children: ReactNode
  branches: GitBranch[]
}

export function BranchesSelectionProvider({
  children,
  branches,
}: BranchesSelectionProviderProps) {
  const [selectedBranches, setSelectedBranches] = useState<SelectedBranches>(
    new Map(),
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const toggleSelectedBranch = useCallback((branch: GitBranch) => {
    setSelectedBranches(prev => {
      const newMap = new Map(prev)
      if (newMap.has(branch.name)) {
        newMap.delete(branch.name)
      } else {
        newMap.set(branch.name, branch)
      }
      return newMap
    })
  }, [])

  const contextValue = useMemo(
    () => ({
      branches,
      selectedBranches,
      selectedIndex,
      setSelectedIndex,
      setSelectedBranches,
      toggleSelectedBranch,
    }),
    [branches, selectedBranches, selectedIndex, toggleSelectedBranch],
  )

  return (
    <BranchesSelectionContext.Provider value={contextValue}>
      {children}
    </BranchesSelectionContext.Provider>
  )
}

export function useBranchesSelectionContext() {
  return useContext(BranchesSelectionContext)
}
