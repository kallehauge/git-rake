import { useCallback, useState, useMemo } from 'react'
import { GitRepository } from '@services/GitRepository.js'
import { GitBranch } from '@services/GitRepository.js'
import { useBranchesSelection } from './useBranchesSelection.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'

export const BRANCH_OPERATIONS = {
  DELETE: 'delete',
  TRASH: 'trash',
  RESTORE: 'restore',
  PRUNE: 'prune',
} as const

export type BranchOperationType =
  (typeof BRANCH_OPERATIONS)[keyof typeof BRANCH_OPERATIONS]

export const UI_OPERATIONS = {
  DELETE: BRANCH_OPERATIONS.DELETE,
  TRASH: BRANCH_OPERATIONS.TRASH,
  RESTORE: BRANCH_OPERATIONS.RESTORE,
} as const

export type UIOperationType = (typeof UI_OPERATIONS)[keyof typeof UI_OPERATIONS]

export type ConfirmationConfig = {
  type: 'alert' | 'warning' | 'info'
  confirmText: string
  cancelText: string
  message?: string
}

export type UseBranchesOperationsReturn = {
  performOperation: (
    operation: BranchOperationType,
    branches: GitBranch[],
  ) => Promise<void>
  pendingOperation: UIOperationType | null
  startConfirmation: (operation: UIOperationType) => void
  handleConfirm: (
    selectedBranches: GitBranch[],
    onRefresh: () => Promise<void>,
  ) => Promise<void>
  handleCancel: () => void
  confirmationConfig: ConfirmationConfig | null
}

export function useBranchesOperations(
  gitRepo: GitRepository,
): UseBranchesOperationsReturn {
  const { clearSelection } = useBranchesSelection()
  const { setState } = useAppUIContext()

  const [pendingOperation, setPendingOperation] =
    useState<UIOperationType | null>(null)

  const performOperation = useCallback(
    async (operation: BranchOperationType, branches: GitBranch[]) => {
      if (branches.length === 0) return

      try {
        const operations = branches.map(branch => ({
          type: operation,
          branch,
        }))

        await gitRepo.performBatchOperations(operations)

        clearSelection()
        setState('ready')
      } catch (err) {
        setState('error')
        throw err
      }
    },
    [gitRepo, clearSelection, setState],
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
        console.error('Operation failed:', error)
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
