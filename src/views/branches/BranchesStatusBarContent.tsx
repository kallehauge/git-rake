import { useMemo } from 'react'
import {
  StatusBarContent,
  type StatusBarItem,
} from '@components/status-bar/StatusBarContent.js'
import type { AppTheme } from '@utils/themes/themes.types.js'

type BranchesStatusBarContentProps = {
  selectedCount: number
  availableCount: number
  totalBranches: number
  filterDisplay: string
  searchMode: boolean
  searchQuery: string
  showSearch: boolean
  theme: AppTheme
}

export function BranchesStatusBarContent({
  selectedCount,
  availableCount,
  totalBranches,
  filterDisplay,
  searchMode,
  searchQuery,
  showSearch,
  theme,
}: BranchesStatusBarContentProps) {
  const items = useMemo((): StatusBarItem[] => {
    const baseItems: StatusBarItem[] = [
      {
        label: 'Selected:',
        value: selectedCount.toString(),
      },
      {
        label: `${searchMode ? 'Found' : 'Showing'}:`,
        value: `${availableCount}/${totalBranches}`,
      },
      {
        label: 'Filter:',
        value: filterDisplay,
      },
    ]

    if (showSearch && (searchMode || searchQuery)) {
      baseItems.push({
        label: 'Search:',
        value: searchQuery + (searchMode ? '|' : ''),
      })
    }

    return baseItems
  }, [
    selectedCount,
    availableCount,
    totalBranches,
    filterDisplay,
    searchMode,
    searchQuery,
    showSearch,
  ])

  return (
    <StatusBarContent
      items={items}
      labelColor={theme.colors.text}
      valueColor={theme.colors.primary}
    />
  )
}
