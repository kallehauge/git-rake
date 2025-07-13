import React from 'react';
import { Box, Text } from 'ink';
import { GitRepository } from '../git/GitRepository.js';
import { useAppState } from '../contexts/AppStateContext.js';
import { useTheme } from './ThemeProvider.js';
import { BranchList } from './BranchList.js';
import { BranchPreview } from './BranchPreview.js';
import { ConfirmationPrompt } from './ConfirmationPrompt.js';
import { StatusBar } from './StatusBar.js';

interface BranchManagementViewProps {
  onConfirmOperation: () => void;
  onCancelOperation: () => void;
  restoreMode: boolean;
  dryRun: boolean;
  currentPath: string;
  gitRepo: GitRepository;
  ctrlCCount: number;
}

export const BranchManagementView = React.memo(function BranchManagementView({
  onConfirmOperation,
  onCancelOperation,
  restoreMode,
  dryRun,
  currentPath,
  gitRepo,
  ctrlCCount,
}: BranchManagementViewProps) {
  const { theme } = useTheme();
  const { state, previewBranch, showDetailView, selectedBranches } = useAppState();

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
        ) : showDetailView ? (
          <BranchPreview branch={previewBranch} gitRepo={gitRepo} />
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
          ) : showDetailView ? (
            'v: back to list • Ctrl+C: exit'
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
