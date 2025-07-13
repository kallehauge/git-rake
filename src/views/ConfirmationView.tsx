import { memo } from 'react';
import { Box, Text } from 'ink';
import { GitBranch } from '../types/index.js';
import { useTheme } from '../contexts/ThemeProvider.js';
import { ConfirmationPrompt } from '../components/ConfirmationPrompt.js';

interface ConfirmationViewProps {
  branches: GitBranch[];
  operation: 'delete' | 'restore';
  dryRun: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentPath: string;
  ctrlCCount: number;
}

export const ConfirmationView = memo(function ConfirmationView({
  branches,
  operation,
  dryRun,
  onConfirm,
  onCancel,
  currentPath,
  ctrlCCount,
}: ConfirmationViewProps) {
  const { theme } = useTheme();

  return (
    <Box flexDirection="column">
      {/* Main content area */}
      <Box flexGrow={1} flexDirection="column" padding={1}>
        <ConfirmationPrompt
          branches={branches}
          operation={operation}
          dryRun={dryRun}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </Box>

      {/* Help bar */}
      <Box borderStyle="single" borderColor={theme.colors.secondary}>
        <Text color={theme.colors.secondary}>
          ←→: navigate • Enter/Y: confirm • ESC/N: cancel
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
