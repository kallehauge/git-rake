import { useCallback } from 'react'
import { GitRepository } from '@services/GitRepository.js'
import { GitBranch } from '@services/GitRepository.js'
import { useBranchSelection } from './useBranchSelection.js'
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

export type UseBranchOperationsReturn = {
  performOperation: (
    operation: BranchOperationType,
    branches: GitBranch[],
  ) => Promise<void>
}

export function useBranchOperations(
  gitRepo: GitRepository,
): UseBranchOperationsReturn {
  const { clearSelection } = useBranchSelection()
  const { setState } = useAppUIContext()

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

  return {
    performOperation,
  }
}
