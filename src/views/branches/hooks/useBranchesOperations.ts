import { useCallback, useState } from 'react'
import { GitRepository } from '@services/GitRepository.js'
import { useBranchesState } from './useBranchesState.js'
import { useSearchContext } from '@contexts/SearchContext.js'
import { logger } from '@utils/logger.js'
import { BRANCH_OPERATIONS } from '../constants.js'
import type { UIOperationType } from '../types.js'
import type { GitBranch } from '@services/GitRepository.types.js'
import type { BranchFilter } from '@utils/filters.types.js'

type BranchOperationType =
  (typeof BRANCH_OPERATIONS)[keyof typeof BRANCH_OPERATIONS]

type UseBranchesOperationsReturn = {
  performOperation: (
    operation: BranchOperationType,
    branches: GitBranch[],
  ) => Promise<void>
  pendingOperation: UIOperationType | null
  enterConfirmationMode: (operation: UIOperationType) => void
  executeOperationAndExit: () => Promise<void>
  exitConfirmationMode: () => void
}

export function useBranchesOperations(
  gitRepo: GitRepository,
  selectedBranches?: GitBranch[],
  onRefresh?: () => Promise<void>,
): UseBranchesOperationsReturn {
  const { clearSelectedBranches } = useBranchesState()
  const { filterType, setFilterType } = useSearchContext()

  const [pendingOperation, setPendingOperation] =
    useState<UIOperationType | null>(null)
  const [filterBeforeConfirmation, setFilterBeforeConfirmation] =
    useState<BranchFilter>('all')

  const performOperation = useCallback(
    async (operation: BranchOperationType, branches: GitBranch[]) => {
      if (branches.length === 0) return

      const operations = branches.map(branch => ({
        type: operation,
        branch,
      }))

      await gitRepo.performBatchOperations(operations)

      clearSelectedBranches()
    },
    [gitRepo, clearSelectedBranches],
  )

  const enterConfirmationMode = useCallback(
    (operation: UIOperationType) => {
      // We reuse the "selected" filter to show all branches when confirming an operation.
      // To make this a good user experience, we return the user to the filter they were
      // using before entering confirmation mode.
      setFilterBeforeConfirmation(filterType)
      setFilterType('selected')
      setPendingOperation(operation)
    },
    [filterType, setFilterType],
  )

  const executeOperationAndExit = useCallback(async () => {
    if (!pendingOperation || !selectedBranches || !onRefresh) return

    try {
      await performOperation(pendingOperation, selectedBranches)
      await onRefresh()
    } catch (error) {
      logger.error('Operation failed', {
        operation: pendingOperation,
        branchCount: selectedBranches.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    } finally {
      setFilterType(filterBeforeConfirmation)
      setPendingOperation(null)
    }
  }, [
    pendingOperation,
    selectedBranches,
    onRefresh,
    performOperation,
    filterBeforeConfirmation,
    setFilterType,
  ])

  const exitConfirmationMode = useCallback(() => {
    setFilterType(filterBeforeConfirmation)
    setPendingOperation(null)
  }, [filterBeforeConfirmation, setFilterType])

  return {
    performOperation,
    pendingOperation,
    enterConfirmationMode,
    executeOperationAndExit,
    exitConfirmationMode,
  }
}
