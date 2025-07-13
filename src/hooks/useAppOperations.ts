import { useCallback } from 'react';
import { GitRepository } from '../services/GitRepository.js';
import { GitBranch } from '../types/index.js';
import { useAppUIContext } from '../contexts/AppProviders.js';

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
  const { setState } = useAppUIContext();

  const handleConfirmOperation = useCallback(async (selectedBranches: GitBranch[]) => {
    setState('operating');

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
      setState('ready');
    } catch (err) {
      onOperationError(err instanceof Error ? err.message : 'Operation failed');
      setState('error');
    }
  }, [gitRepo, restoreMode, dryRun, onOperationComplete, onOperationError, setState]);

  const handleCancelOperation = useCallback(() => {
    setState('ready');
  }, [setState]);

  return {
    handleConfirmOperation,
    handleCancelOperation,
  };
}
