import { useMemo, useCallback } from 'react'
import type { Key } from 'ink'
import type { GitBranch } from '@services/GitRepository.types.js'
import { useBranchesSelectionContext } from '@contexts/BranchesSelectionContext.js'
import { useSearchContext } from '@contexts/SearchContext.js'
import {
  getFilterOptionsForType,
  filterBranches,
  searchBranches,
} from '@utils/filters.js'

type UseBranchesStateReturn = {
  // Display state
  availableBranches: GitBranch[]
  selectedBranches: GitBranch[]
  currentBranch: GitBranch | null
  displayBounds: number

  // Selection actions
  toggleBranchSelection: (branch: GitBranch) => void
  clearSelectedBranches: () => void
  selectAllAvailableBranches: () => void

  // Navigation actions
  handleListNavigation: (key: Key) => boolean
  navigateDown: () => void
  navigateUp: () => void
}

function getValidatedIndex(index: number, arrayLength: number): number {
  return Math.max(0, Math.min(index, arrayLength - 1))
}

export function useBranchesState(): UseBranchesStateReturn {
  const {
    branches,
    selectedBranches,
    selectedIndex,
    setSelectedIndex,
    setSelectedBranches,
    toggleSelectedBranch,
  } = useBranchesSelectionContext()

  const { filterType, searchQuery } = useSearchContext()

  // Optimize: Split dependencies to avoid unnecessary re-computation
  const selectedBranchesArray = useMemo(() => {
    return Array.from(selectedBranches.values())
  }, [selectedBranches])

  const filteredBranches = useMemo(() => {
    // Property-based filtering for non-selected filter types
    const filterOptions = getFilterOptionsForType(filterType)
    let filtered = filterBranches(branches, filterOptions)

    // Apply search within filtered results
    if (searchQuery.trim()) {
      filtered = searchBranches(filtered, searchQuery)
    }

    return filtered
  }, [branches, searchQuery, filterType])

  const availableBranches = useMemo(() => {
    // Special case: return user-selected branches for "selected" filter
    if (filterType === 'selected') {
      return selectedBranchesArray
    }
    return filteredBranches
  }, [filterType, selectedBranchesArray, filteredBranches])

  const displayBounds = availableBranches.length

  const currentBranch = useMemo(() => {
    const validIndex = getValidatedIndex(selectedIndex, displayBounds)
    return availableBranches[validIndex] || null
  }, [availableBranches, selectedIndex, displayBounds])

  const toggleBranchSelection = useCallback(
    (branch: GitBranch) => {
      if (branch.isCurrent) return
      toggleSelectedBranch(branch)
    },
    [toggleSelectedBranch],
  )

  const clearSelectedBranches = useCallback(() => {
    setSelectedBranches(new Map())
  }, [setSelectedBranches])

  const selectAllAvailableBranches = useCallback(() => {
    const branchMap = availableBranches.reduce((map, branch) => {
      if (!branch.isCurrent) {
        map.set(branch.name, branch)
      }
      return map
    }, new Map<string, GitBranch>())
    setSelectedBranches(branchMap)
  }, [availableBranches, setSelectedBranches])

  const moveToIndex = useCallback(
    (newIndex: number) => {
      const validatedIndex = getValidatedIndex(newIndex, displayBounds)
      setSelectedIndex(validatedIndex)
    },
    [setSelectedIndex, displayBounds],
  )

  const navigateDown = useCallback(() => {
    moveToIndex(selectedIndex + 1)
  }, [moveToIndex, selectedIndex])

  const navigateUp = useCallback(() => {
    moveToIndex(selectedIndex - 1)
  }, [moveToIndex, selectedIndex])

  const handleListNavigation = useCallback(
    (key: Key): boolean => {
      if (key.upArrow) {
        moveToIndex(selectedIndex - 1)
        return true
      }

      if (key.downArrow) {
        navigateDown()
        return true
      }

      return false
    },
    [moveToIndex, navigateDown, selectedIndex],
  )

  return {
    // Display state
    availableBranches,
    selectedBranches: selectedBranchesArray,
    currentBranch,
    displayBounds,

    // Selection actions
    toggleBranchSelection,
    clearSelectedBranches,
    selectAllAvailableBranches,

    // Navigation actions
    handleListNavigation,
    navigateDown,
    navigateUp,
  }
}
