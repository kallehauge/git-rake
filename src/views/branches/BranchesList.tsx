import { memo, useCallback } from 'react'
import { Box, Text, useInput } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { BranchesListItem } from './BranchesListItem.js'
import { BranchesListHeader } from './BranchesListHeader.js'
import { useBranchesSelectionContext } from '@contexts/BranchesSelectionContext.js'
import { useSearchContext } from '@contexts/SearchContext.js'
import { useBranchesState } from './hooks/useBranchesState.js'
import { useBranchesListLayout } from './hooks/useBranchesListLayout.js'
import { ScrollableList } from '@components/scrollable-list/index.js'
import type { GitBranch } from '@services/GitRepository.types.js'

type BranchesListProps = {
  branches: GitBranch[]
}

export const BranchesList = memo(function BranchesList({
  branches,
}: BranchesListProps) {
  const { theme, inputLocked } = useAppUIContext()
  const { selectedIndex, selectedBranches } = useBranchesSelectionContext()
  const { searchQuery } = useSearchContext()
  const {
    currentBranch,
    toggleBranchSelection,
    handleListNavigation,
    navigateDown,
    navigateUp,
  } = useBranchesState()
  const columnLayout = useBranchesListLayout()

  const renderBranchItem = useCallback(
    (branch: GitBranch, index: number, isSelected: boolean) => (
      <BranchesListItem
        key={branch.ref}
        branch={branch}
        isSelected={isSelected}
        isMarked={selectedBranches.has(branch.name)}
        showSelection={!branch.isCurrent}
        columnLayout={columnLayout}
      />
    ),
    [selectedBranches, columnLayout],
  )

  useInput(
    (input, key) => {
      if (handleListNavigation(key, input)) return

      if (input.toLowerCase() === 's' && currentBranch) {
        toggleBranchSelection(currentBranch)
        if (input === 'S') {
          navigateUp()
        } else {
          navigateDown()
        }
        return
      }
    },
    { isActive: !inputLocked },
  )

  return (
    <Box flexDirection="column">
      <BranchesListHeader columnLayout={columnLayout} />

      {branches.length === 0 ? (
        <Box justifyContent="center" alignItems="center" flexGrow={1}>
          <Text color={theme.colors.muted}>
            {searchQuery
              ? `No branches found for "${searchQuery}"`
              : 'No branches found'}
          </Text>
        </Box>
      ) : (
        <ScrollableList
          items={branches}
          renderItem={renderBranchItem}
          selectedIndex={selectedIndex}
          centerSelected={true}
        />
      )}
    </Box>
  )
})
