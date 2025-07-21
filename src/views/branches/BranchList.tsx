import React from 'react'
import { Box, Text, useInput } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { BranchItem } from './BranchItem.js'
import { BranchListHeader } from './BranchListHeader.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'
import { useSelectionContext } from '@contexts/SelectionContext.js'
import { useSearchContext } from '@contexts/SearchContext.js'
import { useBranchSelection } from '@hooks/useBranchSelection.js'

export const BranchList = React.memo(function BranchList() {
  const { theme, state, inputLocked } = useAppUIContext()
  const { filteredBranches, currentBranch } = useBranchDataContext()
  const { selectedIndex, selectedBranchNames } = useSelectionContext()
  const { searchQuery } = useSearchContext()
  const { toggleBranchSelection, handleListNavigation } = useBranchSelection()

  useInput(
    (input, key) => {
      if (state !== 'ready') return

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
      <BranchListHeader />

      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {filteredBranches.length === 0 ? (
          <Box justifyContent="center" alignItems="center" height={10}>
            <Text color={theme.colors.secondary}>
              {searchQuery
                ? `No branches found for "${searchQuery}"`
                : 'No branches found'}
            </Text>
          </Box>
        ) : (
          filteredBranches.map((branch, index) => (
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
