import { Text } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'

export function BranchStatusBarContent() {
  const { statusBarInfo } = useBranchDataContext()
  const {
    filterType,
    totalBranches,
    filteredBranches,
    selectedCount,
    searchMode,
    searchQuery,
  } = statusBarInfo
  const { theme } = useAppUIContext()

  const getFilterDisplay = () => {
    switch (filterType) {
      case 'all':
        return 'All'
      case 'merged':
        return 'Merged'
      case 'stale':
        return 'Stale'
      case 'unmerged':
        return 'Unmerged'
      default:
        return 'All'
    }
  }

  return (
    <>
      {/* Filter and count info */}
      <Text color={theme.colors.text}>
        Filter: <Text color={theme.colors.primary}>{getFilterDisplay()}</Text>
      </Text>
      <Text color={theme.colors.text}> • </Text>
      <Text color={theme.colors.text}>
        {searchMode ? 'Found' : 'Showing'}:{' '}
        <Text color={theme.colors.success}>{filteredBranches}</Text>/
        {totalBranches}
      </Text>

      {/* Search info if in search mode */}
      {(searchMode || searchQuery) && (
        <>
          <Text color={theme.colors.text}> • </Text>
          <Text color={theme.colors.text}>
            Search: <Text color={theme.colors.primary}>{searchQuery}</Text>
            {searchMode && <Text color={theme.colors.primary}>|</Text>}
          </Text>
        </>
      )}

      {selectedCount > 0 && (
        <>
          <Text color={theme.colors.text}> • </Text>
          <Text color={theme.colors.text}>
            Selected: <Text color={theme.colors.warning}>{selectedCount}</Text>
          </Text>
        </>
      )}
    </>
  )
}
