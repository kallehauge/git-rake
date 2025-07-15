import { memo } from 'react';
import { Box, Text } from 'ink';
import { GitBranch } from '../../types/index.js';
import { ConfirmationPrompt } from './ConfirmationPrompt.js';
import { ViewLayout } from '../../components/ViewLayout.js';
import { useTheme } from '../../contexts/ThemeProvider.js';

interface ConfirmationViewProps {
  branches: GitBranch[];
  operation: 'delete' | 'restore';
  dryRun: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentPath: string;
}

export const ConfirmationView = memo(function ConfirmationView({
  branches,
  operation,
  dryRun,
  onConfirm,
  onCancel,
  currentPath,
}: ConfirmationViewProps) {
  const { theme } = useTheme();
  const helpText = '←→: navigate • Enter/Y: confirm • ESC/N: cancel';

  const statusBarContent = (
    <Text color={theme.colors.primary} bold>
      Confirm {operation === 'delete' ? 'Delete' : 'Restore'}
    </Text>
  );

  return (
    <ViewLayout
      statusBarContent={statusBarContent}
      dryRun={dryRun}
      helpText={helpText}
      currentPath={currentPath}
    >
      <Box flexGrow={1} flexDirection="column" padding={1}>
        <ConfirmationPrompt
          branches={branches}
          operation={operation}
          dryRun={dryRun}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </Box>
    </ViewLayout>
  );
});
