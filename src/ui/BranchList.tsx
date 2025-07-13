import React from 'react';
import { useInput } from 'ink';
import { Box, Text } from 'ink';
import { useTheme } from './ThemeProvider.js';
import { BranchItem } from './BranchItem.js';
import { BranchListHeader } from './BranchListHeader.js';
import { useKeyboardHandler } from '../hooks/useKeyboardHandler.js';
import { useAppState } from '../contexts/AppStateContext.js';

interface BranchListProps {
  loading?: boolean;
}

export const BranchList = React.memo(function BranchList({ loading = false }: BranchListProps) {
  const { theme } = useTheme();
  const {
    filteredBranches,
    selectedIndex,
    selectedBranchNames,
    searchQuery,
  } = useAppState();

  const { handleKeyInput } = useKeyboardHandler();

  useInput(handleKeyInput);

  if (loading) {
    return (
      <Box flexDirection="column" height="100%">
        <Text color={theme.colors.text}>Loading branches...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <BranchListHeader />

      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {filteredBranches.length === 0 ? (
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Text color={theme.colors.secondary}>
              {searchQuery ? `No branches found for "${searchQuery}"` : 'No branches found'}
            </Text>
          </Box>
        ) : (
          filteredBranches.map((branch, index) => (
            <BranchItem
              key={branch.ref}
              branch={branch}
              isSelected={index === selectedIndex}
              isMarked={selectedBranchNames.has(branch.name)}
              showSelection={!branch.isCurrent}
            />
          ))
        )}
      </Box>
    </Box>
  );
});
