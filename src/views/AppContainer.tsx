import { useState, useCallback, useEffect, useRef } from 'react';
import { useInput, useApp, Box, Text } from 'ink';
import { useGitRepository } from '../hooks/useGitRepository.js';
import { useAppOperations } from '../hooks/useAppOperations.js';
import { useBranchSelection } from '../hooks/useBranchSelection.js';
import { useAppUIContext, useBranchDataContext } from '../contexts/AppProviders.js';
import { useTheme } from '../contexts/ThemeProvider.js';
import { BranchesView } from './branches/BranchesView.js';
import { BranchView } from './BranchView.js';
import { ConfirmationView } from './confirmation/ConfirmationView.js';
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
  const { theme } = useTheme();
  const { state, setState, currentView, setCurrentView } = useAppUIContext();
  const [showExitWarning, setShowExitWarning] = useState(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { selectedBranches, branches } = useBranchDataContext();
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

  const handleConfirmOperationCallback = useCallback(() => {
    handleConfirmOperation(selectedBranches);
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

  // Set to ready state once branches are loaded from Git
  useEffect(() => {
    if (branches.length > 0 && state === 'loading') {
      setState('ready');
    }
  }, [branches.length, state, setState]);

  const renderCurrentView = () => {
    if (state === 'error') {
      return <ErrorView error={error} currentPath={currentPath} />;
    }

    if (state === 'operating') {
      return <OperatingView dryRun={dryRun} currentPath={currentPath} />;
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
      {showExitWarning && (
        <Box paddingX={1} paddingY={0}>
          <Text color={theme.colors.warning}>
            Press Ctrl+C again to exit
          </Text>
        </Box>
      )}
    </Box>
  );
}
