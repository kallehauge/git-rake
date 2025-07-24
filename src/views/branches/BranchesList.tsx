import React from 'react'
import { Box, Text, useInput } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { BranchItem } from './BranchItem.js'
import { BranchesListHeader } from './BranchesListHeader.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'
import { useSelectionContext } from '@contexts/SelectionContext.js'
import { useSearchContext } from '@contexts/SearchContext.js'
import { useBranchesSelection } from './hooks/useBranchesSelection.js'
import type { GitBranch } from '@services/GitRepository.types.js'

type BranchesListProps = {
  branches: GitBranch[]
}

export const BranchesList = React.memo(function BranchesList({
  branches,
}: BranchesListProps) {
  const { theme, inputLocked } = useAppUIContext()
  const { currentBranch, isRefreshing } = useBranchDataContext()
  const { selectedIndex, selectedBranchNames } = useSelectionContext()
  const { searchQuery } = useSearchContext()
  const { toggleBranchSelection, handleListNavigation } = useBranchesSelection()

  useInput(
    (input, key) => {
      if (isRefreshing) return

      if (handleListNavigation(key)) return

      if (input === ' ' && currentBranch) {
        toggleBranchSelection(currentBranch)
        return
      }
    },
    { isActive: !inputLocked },
  )

  return (
    <Box flexDirection="column">
      <BranchesListHeader />

      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {branches.length === 0 ? (
          <Box justifyContent="center" alignItems="center" height={10}>
            <Text color={theme.colors.muted}>
              {searchQuery
                ? `No branches found for "${searchQuery}"`
                : 'No branches found'}
            </Text>
          </Box>
        ) : (
          branches.map((branch, index) => (
            <BranchItem
              key={branch.ref}
              branch={branch}
              isSelected={index === selectedIndex}
              isMarked={selectedBranchNames.has(branch.name)}
              showSelection={!branch.isCurrent}
            />
          ))
        )}
      </Box>
    </Box>
  )
})
