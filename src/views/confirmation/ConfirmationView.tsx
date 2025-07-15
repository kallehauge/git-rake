import { memo, useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import { GitBranch } from '../../types/index.js';
import { ConfirmationPrompt } from './ConfirmationPrompt.js';
import { ViewLayout } from '../../components/ViewLayout.js';
import { useTheme } from '../../contexts/ThemeProvider.js';
import { Spinner } from '../../components/Spinner.js';

interface ConfirmationViewProps {
  branches: GitBranch[];
  operation: 'delete' | 'restore';
  dryRun: boolean;
  onConfirm: () => Promise<void>;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const helpText = '←→: navigate • Enter/Y: confirm • ESC/N: cancel';

  const handleConfirmWithLoading = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  }, [onConfirm]);

  const statusBarContent = (
    <Text color={theme.colors.primary} bold>
      {isProcessing
        ? (dryRun ? 'Previewing' : (operation === 'delete' ? 'Deleting' : 'Restoring'))
        : `Confirm ${operation === 'delete' ? 'Delete' : 'Restore'}`
      }
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
        {isProcessing ? (
          <Spinner
            text={dryRun
              ? `Previewing ${operation}...`
              : `${operation === 'delete' ? 'Deleting' : 'Restoring'} ${branches.length} branch${branches.length > 1 ? 'es' : ''}...`
            }
          />
        ) : (
          <ConfirmationPrompt
            branches={branches}
            operation={operation}
            dryRun={dryRun}
            onConfirm={handleConfirmWithLoading}
            onCancel={onCancel}
          />
        )}
      </Box>
    </ViewLayout>
  );
});
