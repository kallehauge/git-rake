import { useCallback } from 'react'
import { Key } from 'ink'
import type { GitBranch } from '@services/GitRepository.types.js'
import { useSelectionContext } from '@contexts/SelectionContext.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'

type UseBranchesSelectionReturn = {
  toggleBranchSelection: (branch: GitBranch) => void
  clearSelection: () => void
  setSelectedBranches: (branches: GitBranch[]) => void
  selectAllVisibleBranches: () => void
  navigateUp: () => void
  navigateDown: () => void
  handleListNavigation: (key: Key) => boolean
}

export function useBranchesSelection(): UseBranchesSelectionReturn {
  const {
    selectedBranchNames,
    selectedIndex,
    setSelectedIndex,
    setSelectedBranchNames,
  } = useSelectionContext()
  const { filteredBranches } = useBranchDataContext()

  const toggleBranchSelection = useCallback(
    (branch: GitBranch) => {
      if (branch.isCurrent) return

      const newSet = new Set(selectedBranchNames)
      if (newSet.has(branch.name)) {
        newSet.delete(branch.name)
      } else {
        newSet.add(branch.name)
      }
      setSelectedBranchNames(newSet)
    },
    [selectedBranchNames, setSelectedBranchNames],
  )

  const clearSelection = useCallback(() => {
    setSelectedBranchNames(new Set())
  }, [setSelectedBranchNames])

  const setSelectedBranches = useCallback(
    (branches: GitBranch[]) => {
      const branchNames = new Set(branches.map(b => b.name))
      setSelectedBranchNames(branchNames)
    },
    [setSelectedBranchNames],
  )

  const selectAllVisibleBranches = useCallback(() => {
    const selectableBranches = filteredBranches.filter(
      branch => !branch.isCurrent,
    )
    setSelectedBranches(selectableBranches)
  }, [filteredBranches, setSelectedBranches])

  const navigateUp = useCallback(() => {
    const newIndex = Math.max(0, selectedIndex - 1)
    setSelectedIndex(newIndex)
  }, [selectedIndex, setSelectedIndex])

  const navigateDown = useCallback(() => {
    const maxIndex = Math.max(0, filteredBranches.length - 1)
    const newIndex = Math.min(maxIndex, selectedIndex + 1)
    setSelectedIndex(newIndex)
  }, [selectedIndex, setSelectedIndex, filteredBranches.length])

  const handleListNavigation = useCallback(
    (key: Key): boolean => {
      if (key.upArrow) {
        navigateUp()
        return true
      }

      if (key.downArrow) {
        navigateDown()
        return true
      }

      return false
    },
    [navigateUp, navigateDown],
  )

  return {
    toggleBranchSelection,
    clearSelection,
    setSelectedBranches,
    selectAllVisibleBranches,
    navigateUp,
    navigateDown,
    handleListNavigation,
  }
}
