import { Text } from 'ink'
import type { AppTheme } from '@utils/themes/themes.types.js'

type BranchesStatusBarContentProps = {
  selectedCount: number
  filteredCount: number
  totalBranches: number
  filterDisplay: string
  searchMode: boolean
  searchQuery: string
  showSearch: boolean
  theme: AppTheme
}

export function BranchesStatusBarContent({
  selectedCount,
  filteredCount,
  totalBranches,
  filterDisplay,
  searchMode,
  searchQuery,
  showSearch,
  theme,
}: BranchesStatusBarContentProps) {
  return (
    <>
      <Text color={theme.colors.text}>
        Selected: <Text color={theme.colors.warning}>{selectedCount}</Text>
      </Text>

      <Text color={theme.colors.text}> • </Text>
      <Text color={theme.colors.text}>
        {searchMode ? 'Found' : 'Showing'}:{' '}
        <Text color={theme.colors.success}>{filteredCount}</Text>/
        {totalBranches}
      </Text>

      <Text color={theme.colors.text}> • </Text>
      <Text color={theme.colors.text}>
        Filter: <Text color={theme.colors.primary}>{filterDisplay}</Text>
      </Text>

      {showSearch && (searchMode || searchQuery) && (
        <>
          <Text color={theme.colors.text}> • </Text>
          <Text color={theme.colors.text}>
            Search: <Text color={theme.colors.primary}>{searchQuery}</Text>
            {searchMode && <Text color={theme.colors.accent}>|</Text>}
          </Text>
        </>
      )}
    </>
  )
}
