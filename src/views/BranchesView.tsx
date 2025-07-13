import React from 'react';
import { Box, Text } from 'ink';
import { useAppUIContext, useBranchDataContext } from '../contexts/AppProviders.js';
import { useTheme } from '../contexts/ThemeProvider.js';
import { BranchList } from '../components/BranchList.js';
import { ConfirmationPrompt } from '../components/ConfirmationPrompt.js';
import { StatusBar } from '../components/StatusBar.js';

interface BranchesViewProps {
  onConfirmOperation: () => void;
  onCancelOperation: () => void;
  restoreMode: boolean;
  dryRun: boolean;
  currentPath: string;
  ctrlCCount: number;
}

export const BranchesView = React.memo(function BranchesView({
  onConfirmOperation,
  onCancelOperation,
  restoreMode,
  dryRun,
  currentPath,
  ctrlCCount,
}: BranchesViewProps) {
  const { theme } = useTheme();
  const { state } = useAppUIContext();
  const { selectedBranches } = useBranchDataContext();

  return (
    <Box flexDirection="column">
      {/* Status bar */}
      <StatusBar
        restoreMode={restoreMode}
        dryRun={dryRun}
      />

      {/* Main content area */}
      <Box flexGrow={1} flexDirection="column">
        {state === 'confirming' ? (
          <Box padding={1}>
            <ConfirmationPrompt
              branches={selectedBranches}
              operation={restoreMode ? 'restore' : 'delete'}
              dryRun={dryRun}
              onConfirm={onConfirmOperation}
              onCancel={onCancelOperation}
            />
          </Box>
        ) : (
          <BranchList
            loading={state === 'loading'}
          />
        )}
      </Box>

      {/* Help bar */}
      <Box borderStyle="single" borderColor={theme.colors.secondary}>
        <Text color={theme.colors.secondary}>
          {state === 'confirming' ? (
            '←→: navigate • Enter/Y: confirm • ESC/N: cancel'
          ) : (
            `↑↓: navigate • Space: select • /: search • f: filter • v: details • ${restoreMode ? 'r: restore' : 'd: delete'} • Ctrl+C: exit`
          )}
          {ctrlCCount > 0 && (
            <Text color={theme.colors.warning}> (Press Ctrl+C again to exit)</Text>
          )}
        </Text>
      </Box>

      {/* Repository info */}
      <Box paddingX={1}>
        <Text color={theme.colors.secondary}>
          Cwd: {currentPath}
        </Text>
      </Box>
    </Box>
  );
});
