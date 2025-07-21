import { useCallback } from 'react'
import { GitRepository } from '@services/GitRepository.js'
import { GitBranch } from '@services/GitRepository.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'

interface UseAppOperationsProps {
  gitRepo: GitRepository
  restoreMode: boolean
  onOperationComplete: () => Promise<void>
  onOperationError: (error: string) => void
}

export function useAppOperations({
  gitRepo,
  restoreMode,
  onOperationComplete,
  onOperationError,
}: UseAppOperationsProps) {
  const { setState } = useAppUIContext()

  const handleConfirmOperation = useCallback(
    async (selectedBranches: GitBranch[]) => {
      try {
        const operations = selectedBranches.map(branch => ({
          type: restoreMode ? ('restore' as const) : ('delete' as const),
          branch,
        }))

        await gitRepo.performBatchOperations(operations)

        await onOperationComplete()
        setState('ready')
      } catch (err) {
        onOperationError(
          err instanceof Error ? err.message : 'Operation failed',
        )
        setState('error')
      }
    },
    [gitRepo, restoreMode, onOperationComplete, onOperationError, setState],
  )

  const handleCancelOperation = useCallback(() => {
    setState('ready')
  }, [setState])

  return {
    handleConfirmOperation,
    handleCancelOperation,
  }
}
