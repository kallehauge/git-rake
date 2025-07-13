import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { GitBranch } from '../types/index.js';
import { useTheme } from '../contexts/ThemeProvider.js';

interface ConfirmationPromptProps {
  branches: GitBranch[];
  operation: 'delete' | 'restore';
  dryRun?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationPrompt({ branches, operation, dryRun = false, onConfirm, onCancel }: ConfirmationPromptProps) {
  const { theme } = useTheme();
  const [selectedOption, setSelectedOption] = useState<'confirm' | 'cancel'>('cancel');

  useInput((input, key) => {
    // Allow Ctrl+C to pass through to App component for exit handling
    if (key.ctrl && input === 'c') {
      return;
    }

    if (key.leftArrow || key.rightArrow) {
      setSelectedOption(selectedOption === 'confirm' ? 'cancel' : 'confirm');
    }

    if (key.return) {
      if (selectedOption === 'confirm') {
        onConfirm();
      } else {
        onCancel();
      }
    }

    if (key.escape) {
      onCancel();
    }

    if (input === 'y' || input === 'Y') {
      onConfirm();
    }

    if (input === 'n' || input === 'N') {
      onCancel();
    }
  });

  const warningColor = operation === 'delete' ? theme.colors.error : theme.colors.warning;

  return (
    <Box flexDirection="column" borderStyle="double" borderColor={warningColor} padding={1}>
      <Text color={warningColor} bold>
        {dryRun ? `DRY RUN: Would ${operation}` : `Confirm ${operation}`} {branches.length} branch{branches.length > 1 ? 'es' : ''}:
      </Text>

      <Box flexDirection="column" height={10} overflow="hidden">
        {branches.map((branch, index) => (
          <Text key={branch.name} color={theme.colors.text}>
            {index + 1}. {branch.name}
            {branch.isMerged && <Text color={theme.colors.success}> (merged)</Text>}
            {branch.isStale && <Text color={theme.colors.warning}> (stale)</Text>}
          </Text>
        ))}
        {branches.length > 10 && (
          <Text color={theme.colors.secondary}>... and {branches.length - 10} more</Text>
        )}
      </Box>

      {!dryRun && operation === 'delete' && (
        <Text color={theme.colors.warning}>
          Note: Branches will be moved to trash and can be restored later.
        </Text>
      )}

      <Box marginTop={1}>
        <Box
          borderStyle="single"
          borderColor={selectedOption === 'confirm' ? theme.colors.success : theme.colors.border}
          paddingX={1}
          marginRight={2}
        >
          <Text color={selectedOption === 'confirm' ? theme.colors.success : theme.colors.text}>
            {dryRun ? 'Preview' : 'Confirm'} (Y)
          </Text>
        </Box>

        <Box
          borderStyle="single"
          borderColor={selectedOption === 'cancel' ? theme.colors.error : theme.colors.border}
          paddingX={1}
        >
          <Text color={selectedOption === 'cancel' ? theme.colors.error : theme.colors.text}>
            Cancel (N)
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color={theme.colors.secondary}>
          ←→: navigate • Enter/Y: confirm • ESC/N: cancel
        </Text>
      </Box>
    </Box>
  );
}
