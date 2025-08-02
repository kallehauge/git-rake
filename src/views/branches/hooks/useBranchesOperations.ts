import { useCallback, useState, useMemo } from 'react'
import { GitRepository } from '@services/GitRepository.js'
import { useBranchesSelection } from './useBranchesSelection.js'
import { logger } from '@utils/logger.js'
import { BRANCH_OPERATIONS } from '../constants.js'
import type { UIOperationType } from '../types.js'
import type { GitBranch } from '@services/GitRepository.types.js'

type BranchOperationType =
  (typeof BRANCH_OPERATIONS)[keyof typeof BRANCH_OPERATIONS]

type ConfirmationConfig = {
  type: 'alert' | 'warning' | 'info'
  confirmText: string
  cancelText: string
  message?: string
}

type UseBranchesOperationsReturn = {
  performOperation: (
    operation: BranchOperationType,
    branches: GitBranch[],
  ) => Promise<void>
  pendingOperation: UIOperationType | null
  startConfirmation: (operation: UIOperationType) => void
  createOperationHandler: (
    selectedBranches: GitBranch[],
    onRefresh: () => Promise<void>,
  ) => () => Promise<void>
  handleCancel: () => void
  confirmationConfig: ConfirmationConfig | null
}

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

  const createOperationHandler = useCallback(
    (selectedBranches: GitBranch[], onRefresh: () => Promise<void>) => {
      return async () => {
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
          throw error
        } finally {
          setPendingOperation(null)
        }
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
        [BRANCH_OPERATIONS.DELETE]: {
          type: 'alert' as const,
          confirmText: 'Delete (Y)',
          cancelText: 'Cancel (N)',
          message: '⚠️ WARNING: This will permanently delete branches!',
        },
        [BRANCH_OPERATIONS.TRASH]: {
          type: 'warning' as const,
          confirmText: 'Trash (Y)',
          cancelText: 'Cancel (N)',
          message:
            'Note: Branches will be moved to trash and can be restored later.',
        },
        [BRANCH_OPERATIONS.RESTORE]: {
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
    createOperationHandler,
    handleCancel,
    confirmationConfig,
  }
}
