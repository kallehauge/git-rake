import { useCallback, useState, useMemo } from 'react'
import { GitRepository } from '@services/GitRepository.js'
import { useBranchesSelection } from './useBranchesSelection.js'
import { logger } from '@utils/logger.js'
import { UI_OPERATIONS } from './branches.types.js'
import type {
  BranchOperationType,
  UIOperationType,
  ConfirmationConfig,
  UseBranchesOperationsReturn,
} from './branches.types.js'
import type { GitBranch } from '@services/GitRepository.types.js'

export function useBranchesOperations(
  gitRepo: GitRepository,
): UseBranchesOperationsReturn {
  const { clearSelection } = useBranchesSelection()

  const [pendingOperation, setPendingOperation] =
    useState<UIOperationType | null>(null)

  const performOperation = useCallback(
    async (operation: BranchOperationType, branches: GitBranch[]) => {
      if (branches.length === 0) return

      const operations = branches.map(branch => ({
        type: operation,
        branch,
      }))

      await gitRepo.performBatchOperations(operations)

      clearSelection()
    },
    [gitRepo, clearSelection],
  )

  const startConfirmation = useCallback((operation: UIOperationType) => {
    setPendingOperation(operation)
  }, [])

  const handleConfirm = useCallback(
    async (selectedBranches: GitBranch[], onRefresh: () => Promise<void>) => {
      if (!pendingOperation) return
      try {
        await performOperation(pendingOperation, selectedBranches)
        await onRefresh()
      } catch (error) {
        logger.error('Operation failed', {
          operation: pendingOperation,
          branchCount: selectedBranches.length,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        setPendingOperation(null)
      }
    },
    [pendingOperation, performOperation],
  )

  const handleCancel = useCallback(() => {
    setPendingOperation(null)
  }, [])

  const createConfirmationConfig = useCallback(
    (operation: UIOperationType): ConfirmationConfig => {
      const configs = {
        [UI_OPERATIONS.DELETE]: {
          type: 'alert' as const,
          confirmText: 'Delete (Y)',
          cancelText: 'Cancel (N)',
          message: '⚠️ WARNING: This will permanently delete branches!',
        },
        [UI_OPERATIONS.TRASH]: {
          type: 'warning' as const,
          confirmText: 'Trash (Y)',
          cancelText: 'Cancel (N)',
          message:
            'Note: Branches will be moved to trash and can be restored later.',
        },
        [UI_OPERATIONS.RESTORE]: {
          type: 'info' as const,
          confirmText: 'Restore (Y)',
          cancelText: 'Cancel (N)',
        },
      }
      return configs[operation]
    },
    [],
  )

  const confirmationConfig = useMemo(() => {
    return pendingOperation ? createConfirmationConfig(pendingOperation) : null
  }, [pendingOperation, createConfirmationConfig])

  return {
    performOperation,
    pendingOperation,
    startConfirmation,
    handleConfirm,
    handleCancel,
    confirmationConfig,
  }
}
