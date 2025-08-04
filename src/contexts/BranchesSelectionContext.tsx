import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useMemo,
  useCallback,
} from 'react'
import type { GitBranch } from '@services/GitRepository.types.js'

type BranchesSelectionContextState = {
  branches: GitBranch[]
  selectedBranchNames: Set<string>
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  setSelectedBranchNames: (names: Set<string>) => void
  addSelectedBranch: (branchName: string) => void
  removeSelectedBranch: (branchName: string) => void
}

const defaultBranchesSelectionState: BranchesSelectionContextState = {
  branches: [],
  selectedBranchNames: new Set(),
  selectedIndex: 0,
  setSelectedIndex: () => {},
  setSelectedBranchNames: () => {},
  addSelectedBranch: () => {},
  removeSelectedBranch: () => {},
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
  const [selectedBranchNames, setSelectedBranchNames] = useState<Set<string>>(
    new Set(),
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const addSelectedBranch = useCallback((branchName: string) => {
    setSelectedBranchNames(prev => new Set(prev).add(branchName))
  }, [])

  const removeSelectedBranch = useCallback((branchName: string) => {
    setSelectedBranchNames(prev => {
      const newSet = new Set(prev)
      newSet.delete(branchName)
      return newSet
    })
  }, [])

  const contextValue = useMemo(
    () => ({
      branches,
      selectedBranchNames,
      selectedIndex,
      setSelectedIndex,
      setSelectedBranchNames,
      addSelectedBranch,
      removeSelectedBranch,
    }),
    [
      branches,
      selectedBranchNames,
      selectedIndex,
      addSelectedBranch,
      removeSelectedBranch,
    ],
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
