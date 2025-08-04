import { useMemo } from 'react'
import { StatusBarConfirmation } from '@components/status-bar/StatusBarConfirmation.js'
import { BranchesStatusBarContent } from './BranchesStatusBarContent.js'
import { OPERATION_CONFIRMATION_CONFIG } from './constants.js'
import { useSearchContext } from '@contexts/SearchContext.js'
import { useBranchesSelectionContext } from '@contexts/BranchesSelectionContext.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { useBranchesState } from './hooks/useBranchesState.js'
import { getFilterDisplayText } from '@utils/filters.js'
import type { UIOperationType } from './types.js'
import type { GitBranch } from '@services/GitRepository.types.js'

type BranchesStatusBarProps = {
  pendingOperation: UIOperationType | null
  selectedBranches: GitBranch[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function BranchesStatusBar({
  pendingOperation,
  selectedBranches,
  onConfirm,
  onCancel,
}: BranchesStatusBarProps) {
  const { searchMode, searchQuery, filterType } = useSearchContext()
  const { branches } = useBranchesSelectionContext()
  const { theme } = useAppUIContext()
  const { displayBounds } = useBranchesState()

  const statusBarData = useMemo(() => {
    const filterDisplay = pendingOperation
      ? 'Selected'
      : getFilterDisplayText(filterType)

    return {
      selectedCount: selectedBranches.length,
      availableCount: displayBounds,
      totalBranches: branches.length,
      filterDisplay,
      searchMode,
      searchQuery,
      showSearch: !pendingOperation,
      theme,
    }
  }, [
    pendingOperation,
    selectedBranches.length,
    displayBounds,
    branches.length,
    filterType,
    searchMode,
    searchQuery,
    theme,
  ])

  return useMemo(() => {
    if (!pendingOperation) {
      return <BranchesStatusBarContent {...statusBarData} />
    }

    const config = OPERATION_CONFIRMATION_CONFIG[pendingOperation]
    return (
      <StatusBarConfirmation
        type={config.type}
        icon={config.icon}
        action={config.name}
        selectedCount={selectedBranches.length}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
  }, [
    pendingOperation,
    selectedBranches.length,
    onConfirm,
    onCancel,
    statusBarData,
  ])
}
