import { useState, useCallback, useRef } from 'react';
import { useInput, useApp, Box } from 'ink';
import { useGitRepository } from '../../hooks/useGitRepository.js';
import { useAppOperations } from '../../hooks/useAppOperations.js';
import { useBranchSelection } from '../../hooks/useBranchSelection.js';
import { useAppUIContext, useBranchDataContext } from '../../contexts/AppProviders.js';
import { BranchesView } from '../branches/BranchesView.js';
import { BranchView } from '../branch/BranchView.js';
import { ConfirmationView } from '../confirmation/ConfirmationView.js';
import { ErrorView } from '../error/ErrorView.js';
import { ExitWarning } from './ExitWarning.js';


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
  const { state, currentView, setCurrentView } = useAppUIContext();
  const [showExitWarning, setShowExitWarning] = useState(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { selectedBranches } = useBranchDataContext();
  const { clearSelection } = useBranchSelection();
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
      clearSelection();
      setCurrentView('branches');
    },
    onOperationError: setError,
  });

  const handleConfirmOperationCallback = useCallback(async () => {
    return handleConfirmOperation(selectedBranches);
  }, [handleConfirmOperation, selectedBranches]);

  const handleCtrlC = useCallback(() => {
    if (showExitWarning) {
      process.stdout.write('\x1b[2J\x1b[0f');
      exit();
    } else {
      setShowExitWarning(true);

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }

      exitTimeoutRef.current = setTimeout(() => {
        setShowExitWarning(false);
        exitTimeoutRef.current = null;
      }, 2000);
    }
  }, [showExitWarning, exit]);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      handleCtrlC();
    }
  });

  const renderCurrentView = () => {
    if (state === 'error') {
      return <ErrorView error={error} currentPath={currentPath} />;
    }

    switch (currentView) {
      case 'branch':
        return <BranchView gitRepo={gitRepo} currentPath={currentPath} />;

      case 'confirmation':
        return (
          <ConfirmationView
            branches={selectedBranches}
            operation={restoreMode ? 'restore' : 'delete'}
            dryRun={dryRun}
            onConfirm={handleConfirmOperationCallback}
            onCancel={() => setCurrentView('branches')}
            currentPath={currentPath}
          />
        );

      case 'branches':
      default:
        return (
          <BranchesView
            restoreMode={restoreMode}
            dryRun={dryRun}
            currentPath={currentPath}
          />
        );
    }
  };

  return (
    <Box flexDirection="column">
      {renderCurrentView()}
      {showExitWarning && <ExitWarning />}
    </Box>
  );
}
