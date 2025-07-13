import { useCallback } from 'react';
import { GitRepository } from '../git/GitRepository.js';
import { GitBranch } from '../types/index.js';
import { useAppState } from '../contexts/AppStateContext.js';

interface UseAppOperationsProps {
  gitRepo: GitRepository;
  restoreMode: boolean;
  dryRun: boolean;
  onOperationComplete: () => Promise<void>;
  onOperationError: (error: string) => void;
}

export function useAppOperations({
  gitRepo,
  restoreMode,
  dryRun,
  onOperationComplete,
  onOperationError,
}: UseAppOperationsProps) {
  const { dispatch } = useAppState();

  const handleConfirmOperation = useCallback(async (selectedBranches: GitBranch[]) => {
    dispatch({ type: 'SET_STATE', payload: 'operating' });

    try {
      const operations = selectedBranches.map(branch => ({
        type: restoreMode ? 'restore' as const : 'delete' as const,
        branch,
        dryRun,
      }));

      if (!dryRun) {
        await gitRepo.performBatchOperations(operations);
      }

      await onOperationComplete();
      dispatch({ type: 'SET_STATE', payload: 'browsing' });
    } catch (err) {
      onOperationError(err instanceof Error ? err.message : 'Operation failed');
      dispatch({ type: 'SET_STATE', payload: 'error' });
    }
  }, [gitRepo, restoreMode, dryRun, onOperationComplete, onOperationError, dispatch]);

  const handleCancelOperation = useCallback(() => {
    dispatch({ type: 'SET_STATE', payload: 'browsing' });
  }, [dispatch]);

  return {
    handleConfirmOperation,
    handleCancelOperation,
  };
}
