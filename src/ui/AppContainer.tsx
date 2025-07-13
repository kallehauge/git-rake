import { useState, useCallback, useEffect } from 'react';
import { useInput, useApp } from 'ink';
import { useGitRepository } from '../hooks/useGitRepository.js';
import { useAppOperations } from '../hooks/useAppOperations.js';
import { useAppState } from '../contexts/AppStateContext.js';
import { BranchManagementView } from './BranchManagementView.js';
import { ErrorView } from './ErrorView.js';
import { OperatingView } from './OperatingView.js';

interface AppContainerProps {
  dryRun?: boolean;
  includeRemote?: boolean;
  restoreMode?: boolean;
  workingDir?: string;
  onRefreshBranches?: () => Promise<void>;
}

export function AppContainer({
  dryRun = false,
  includeRemote = false,
  restoreMode = false,
  workingDir,
  onRefreshBranches
}: AppContainerProps) {
  const { exit } = useApp();
  const { state, ctrlCCount, selectedBranches, dispatch } = useAppState();
  const [error, setError] = useState<string>('');

  const { gitRepo, currentPath } = useGitRepository({ workingDir });

  const { handleConfirmOperation, handleCancelOperation } = useAppOperations({
    gitRepo,
    restoreMode,
    dryRun,
    onOperationComplete: async () => {
      if (onRefreshBranches) {
        await onRefreshBranches();
      }
      dispatch({ type: 'SET_SELECTED_BRANCHES', payload: [] });
    },
    onOperationError: setError,
  });

  const resetCtrlCTimer = useCallback(() => {
    setTimeout(() => dispatch({ type: 'RESET_CTRL_C_COUNT' }), 2000);
  }, [dispatch]);

  const handleConfirmOperationCallback = useCallback(() => {
    handleConfirmOperation(selectedBranches);
  }, [handleConfirmOperation, selectedBranches]);

  useInput((input, key) => {
    // Handle ESC for exiting detail view
    if (key.escape) {
      dispatch({ type: 'SET_SHOW_DETAIL_VIEW', payload: false });
      return;
    }

    // Handle operations in browsing state
    if (state === 'browsing') {
      if (input === 'd' && selectedBranches.length > 0 && !restoreMode) {
        dispatch({ type: 'SET_STATE', payload: 'confirming' });
        return;
      }

      if (input === 'r' && selectedBranches.length > 0 && restoreMode) {
        dispatch({ type: 'SET_STATE', payload: 'confirming' });
        return;
      }

      if (input === 'v') {
        dispatch({ type: 'TOGGLE_DETAIL_VIEW' });
        return;
      }
    }

    // Double Ctrl+C to exit
    if (key.ctrl && input === 'c') {
      if (ctrlCCount === 0) {
        dispatch({ type: 'SET_CTRL_C_COUNT', payload: 1 });
        resetCtrlCTimer();
      } else {
        process.stdout.write('\x1b[2J\x1b[0f');
        exit();
      }
    }
  });

  // Set initial state to browsing since branches are loaded in App component
  useEffect(() => {
    dispatch({ type: 'SET_STATE', payload: 'browsing' });
  }, [dispatch]);

  if (state === 'error') {
    return <ErrorView error={error} />;
  }

  if (state === 'operating') {
    return <OperatingView dryRun={dryRun} />;
  }

  return (
    <BranchManagementView
      onConfirmOperation={handleConfirmOperationCallback}
      onCancelOperation={handleCancelOperation}
      restoreMode={restoreMode}
      dryRun={dryRun}
      currentPath={currentPath}
      gitRepo={gitRepo}
      ctrlCCount={ctrlCCount}
    />
  );
}
