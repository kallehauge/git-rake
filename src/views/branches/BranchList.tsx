import React from 'react'
import { Box, Text, useInput } from 'ink'
import { useTheme } from '@contexts/ThemeProvider.js'
import { BranchItem } from './BranchItem.js'
import { BranchListHeader } from './BranchListHeader.js'
import {
  useBranchDataContext,
  useSelectionContext,
  useSearchContext,
  useAppUIContext,
} from '@contexts/AppProviders.js'
import { useBranchSelection } from '@hooks/useBranchSelection.js'

interface BranchListProps {}

export const BranchList = React.memo(function BranchList({}: BranchListProps) {
  const { theme } = useTheme()
  const { filteredBranches, currentBranch } = useBranchDataContext()
  const { selectedIndex, selectedBranchNames } = useSelectionContext()
  const { searchQuery } = useSearchContext()
  const { state, inputLocked } = useAppUIContext()
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
    <Box flexDirection="column" height="100%">
      <BranchListHeader />

      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {filteredBranches.length === 0 ? (
          <Box flexGrow={1} justifyContent="center" alignItems="center">
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
