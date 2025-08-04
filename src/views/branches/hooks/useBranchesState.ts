import { useMemo, useCallback } from 'react'
import type { Key } from 'ink'
import type { GitBranch } from '@services/GitRepository.types.js'
import { useBranchesSelectionContext } from '@contexts/BranchesSelectionContext.js'
import { useSearchContext } from '@contexts/SearchContext.js'
import { getFilteredBranches } from '@utils/branchUtils.js'

type UseBranchesStateReturn = {
  // Display state
  availableBranches: GitBranch[]
  selectedBranches: GitBranch[]
  currentBranch: GitBranch | null
  displayBounds: number

  // Selection actions
  toggleBranchSelection: (branch: GitBranch) => void
  clearSelectedBranches: () => void
  setSelectedBranches: (branches: GitBranch[]) => void
  selectAllAvailableBranches: () => void

  // Navigation actions
  handleListNavigation: (key: Key) => boolean
}

function getValidatedIndex(index: number, arrayLength: number): number {
  return Math.max(0, Math.min(index, arrayLength - 1))
}

export function useBranchesState(): UseBranchesStateReturn {
  const {
    branches,
    selectedBranchNames,
    selectedIndex,
    setSelectedIndex,
    setSelectedBranchNames,
    addSelectedBranch,
    removeSelectedBranch,
  } = useBranchesSelectionContext()

  const { filterType, searchQuery } = useSearchContext()

  const selectedBranches = useMemo(() => {
    return branches.reduce((acc: GitBranch[], branch) => {
      if (selectedBranchNames.has(branch.name)) {
        acc.push(branch)
      }
      return acc
    }, [])
  }, [branches, selectedBranchNames])

  const availableBranches = useMemo(() => {
    return getFilteredBranches(
      branches,
      selectedBranches,
      searchQuery,
      filterType,
    )
  }, [branches, selectedBranches, searchQuery, filterType])

  const displayBounds = availableBranches.length

  const currentBranch = useMemo(() => {
    const validIndex = getValidatedIndex(selectedIndex, displayBounds)
    return availableBranches[validIndex] || null
  }, [availableBranches, selectedIndex, displayBounds])

  const toggleBranchSelection = useCallback(
    (branch: GitBranch) => {
      if (branch.isCurrent) return

      if (selectedBranchNames.has(branch.name)) {
        removeSelectedBranch(branch.name)
      } else {
        addSelectedBranch(branch.name)
      }
    },
    [selectedBranchNames, removeSelectedBranch, addSelectedBranch],
  )

  const clearSelectedBranches = useCallback(() => {
    setSelectedBranchNames(new Set())
  }, [setSelectedBranchNames])

  const setSelectedBranches = useCallback(
    (branches: GitBranch[]) => {
      const branchNames = new Set(branches.map(b => b.name))
      setSelectedBranchNames(branchNames)
    },
    [setSelectedBranchNames],
  )

  const selectAllAvailableBranches = useCallback(() => {
    const branchNames = availableBranches.reduce((set, branch) => {
      if (!branch.isCurrent) {
        set.add(branch.name)
      }
      return set
    }, new Set<string>())
    setSelectedBranchNames(branchNames)
  }, [availableBranches, setSelectedBranchNames])

  const handleListNavigation = useCallback(
    (key: Key): boolean => {
      if (key.upArrow) {
        const newIndex = getValidatedIndex(selectedIndex - 1, displayBounds)
        setSelectedIndex(newIndex)
        return true
      }

      if (key.downArrow) {
        const newIndex = getValidatedIndex(selectedIndex + 1, displayBounds)
        setSelectedIndex(newIndex)
        return true
      }

      return false
    },
    [selectedIndex, setSelectedIndex, displayBounds],
  )

  return {
    // Display state
    availableBranches,
    selectedBranches,
    currentBranch,
    displayBounds,

    // Selection actions
    toggleBranchSelection,
    clearSelectedBranches,
    setSelectedBranches,
    selectAllAvailableBranches,

    // Navigation actions
    handleListNavigation,
  }
}
