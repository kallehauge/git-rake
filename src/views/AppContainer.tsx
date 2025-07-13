import { useState, useCallback, useEffect } from 'react';
import { useInput, useApp } from 'ink';
import { useGitRepository } from '../hooks/useGitRepository.js';
import { useAppOperations } from '../hooks/useAppOperations.js';
import { useAppUIContext, useBranchDataContext, useSelectionContext } from '../contexts/AppProviders.js';
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
  const {
    state,
    ctrlCCount,
    resetCtrlCCount,
    setShowDetailView,
    setState,
    toggleDetailView,
    setCtrlCCount
  } = useAppUIContext();
  const { selectedBranches } = useBranchDataContext();
  const { setSelectedBranches } = useSelectionContext();
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
      setSelectedBranches([]);
    },
    onOperationError: setError,
  });

  const resetCtrlCTimer = useCallback(() => {
    setTimeout(() => resetCtrlCCount(), 2000);
  }, [resetCtrlCCount]);

  const handleConfirmOperationCallback = useCallback(() => {
    handleConfirmOperation(selectedBranches);
  }, [handleConfirmOperation, selectedBranches]);

  useInput((input, key) => {
    // Handle ESC for exiting detail view
    if (key.escape) {
      setShowDetailView(false);
      return;
    }

    // Handle operations in browsing state
    if (state === 'browsing') {
      if (input === 'd' && selectedBranches.length > 0 && !restoreMode) {
        setState('confirming');
        return;
      }

      if (input === 'r' && selectedBranches.length > 0 && restoreMode) {
        setState('confirming');
        return;
      }

      if (input === 'v') {
        toggleDetailView();
        return;
      }
    }

    // Double Ctrl+C to exit
    if (key.ctrl && input === 'c') {
      if (ctrlCCount === 0) {
        setCtrlCCount(1);
        resetCtrlCTimer();
      } else {
        process.stdout.write('\x1b[2J\x1b[0f');
        exit();
      }
    }
  });

  // Set initial state to browsing since branches are loaded in App component
  useEffect(() => {
    setState('browsing');
  }, [setState]);

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
