import { memo, useCallback } from 'react'
import { Box, Text, useInput } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { BranchItem } from './BranchItem.js'
import { BranchesListHeader } from './BranchesListHeader.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'
import { useSelectionContext } from '@contexts/SelectionContext.js'
import { useSearchContext } from '@contexts/SearchContext.js'
import { useBranchesSelection } from './hooks/useBranchesSelection.js'
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
  const { currentBranch } = useBranchDataContext()
  const { selectedIndex, selectedBranchNames } = useSelectionContext()
  const { searchQuery } = useSearchContext()
  const { toggleBranchSelection, handleListNavigation } = useBranchesSelection()
  const columnLayout = useBranchesListLayout()

  const renderBranchItem = useCallback(
    (branch: GitBranch, index: number, isSelected: boolean) => (
      <BranchItem
        key={branch.ref}
        branch={branch}
        isSelected={isSelected}
        isMarked={selectedBranchNames.has(branch.name)}
        showSelection={!branch.isCurrent}
        columnLayout={columnLayout}
      />
    ),
    [selectedBranchNames, columnLayout],
  )

  useInput(
    (input, key) => {
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
