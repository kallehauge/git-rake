import { useState, useCallback, useEffect } from 'react';
import { useInput, useApp } from 'ink';
import { useGitRepository } from '../hooks/useGitRepository.js';
import { useAppOperations } from '../hooks/useAppOperations.js';
import { useAppUIContext, useBranchDataContext, useSelectionContext } from '../contexts/AppProviders.js';
import { BranchesView } from './branches/BranchesView.js';
import { BranchView } from './BranchView.js';
import { ConfirmationView } from './confirmation/ConfirmationView.js';
import { ErrorView } from './ErrorView.js';
import { OperatingView } from './OperatingView.js';

type ViewState = 'branches' | 'branch' | 'confirmation';

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
  const { state, setState } = useAppUIContext();

  const [currentView, setCurrentView] = useState<ViewState>('branches');
  const [ctrlCCount, setCtrlCCount] = useState(0);

  const toggleBranchView = useCallback(() => {
    setCurrentView(prev => prev === 'branch' ? 'branches' : 'branch');
  }, []);

  const resetCtrlCCount = useCallback(() => {
    setCtrlCCount(0);
  }, []);
  const { selectedBranches, branches } = useBranchDataContext();
  const { setSelectedBranches } = useSelectionContext();
  const [error, setError] = useState<string>('');

  const { gitRepo, currentPath } = useGitRepository({ workingDir });

  const { handleConfirmOperation } = useAppOperations({
    gitRepo,
    restoreMode,
    dryRun,
    onOperationComplete: async () => {
      if (onRefreshBranches) {
        await onRefreshBranches();
      }
      setSelectedBranches([]);
      setCurrentView('branches');
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
    // Handle ESC for returning to branches view
    if (key.escape) {
      setCurrentView('branches');
      return;
    }

    if (state === 'ready') {
      if (input === 'd' && selectedBranches.length > 0 && !restoreMode) {
        setCurrentView('confirmation');
        return;
      }

      if (input === 'r' && selectedBranches.length > 0 && restoreMode) {
        setCurrentView('confirmation');
        return;
      }

      if (input === 'v') {
        toggleBranchView();
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

  // Set to ready state once branches are loaded from Git
  useEffect(() => {
    if (branches.length > 0 && state === 'loading') {
      setState('ready');
    }
  }, [branches.length, state, setState]);

  if (state === 'error') {
    return <ErrorView error={error} currentPath={currentPath} />;
  }

  if (state === 'operating') {
    return <OperatingView dryRun={dryRun} currentPath={currentPath} ctrlCCount={ctrlCCount} />;
  }

  switch (currentView) {
    case 'branch':
      return <BranchView gitRepo={gitRepo} currentPath={currentPath} ctrlCCount={ctrlCCount} />;

    case 'confirmation':
      return (
        <ConfirmationView
          branches={selectedBranches}
          operation={restoreMode ? 'restore' : 'delete'}
          dryRun={dryRun}
          onConfirm={handleConfirmOperationCallback}
          onCancel={() => setCurrentView('branches')}
          currentPath={currentPath}
          ctrlCCount={ctrlCCount}
        />
      );

    case 'branches':
    default:
      return (
        <BranchesView
          restoreMode={restoreMode}
          dryRun={dryRun}
          currentPath={currentPath}
          ctrlCCount={ctrlCCount}
        />
      );
  }
}
