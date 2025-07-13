import React from 'react';
import { Box, Text } from 'ink';
import { FilterType } from '../types/index.js';
import { useTheme } from './ThemeProvider.js';

interface StatusBarProps {
  filterType: FilterType;
  totalBranches: number;
  filteredBranches: number;
  selectedCount: number;
  restoreMode?: boolean;
  dryRun?: boolean;
  searchMode?: boolean;
  searchInputActive?: boolean;
  searchQuery?: string;
}

function StatusBarInner({ filterType, totalBranches, filteredBranches, selectedCount, restoreMode = false, dryRun = false, searchMode = false, searchInputActive = false, searchQuery = '' }: StatusBarProps) {
  const { theme } = useTheme();


  const getFilterDisplay = () => {
    switch (filterType) {
      case 'all': return 'All';
      case 'merged': return 'Merged';
      case 'stale': return 'Stale';
      case 'unmerged': return 'Unmerged';
      default: return 'All';
    }
  };

  return (
    <Box borderStyle="single" borderColor={theme.colors.primary} paddingX={1}>
      {/* Left side - App title and mode */}
      <Text color={theme.colors.primary} bold>
        Git Rake{restoreMode ? ' - Restore Mode' : ''}
        {dryRun && <Text color={theme.colors.warning}> [DRY RUN]</Text>}
      </Text>

      <Text color={theme.colors.text}> • </Text>

      {/* Filter and count info */}
      <Text color={theme.colors.text}>
        Filter: <Text color={theme.colors.primary}>{getFilterDisplay()}</Text>
      </Text>
      <Text color={theme.colors.text}> • </Text>
      <Text color={theme.colors.text}>
        {searchMode ? 'Found' : 'Showing'}: <Text color={theme.colors.success}>{filteredBranches}</Text>/{totalBranches}
      </Text>

      {/* Search info if in search mode */}
      {searchMode && (
        <>
          <Text color={theme.colors.text}> • </Text>
          <Text color={theme.colors.text}>
            Search: <Text color={theme.colors.primary}>{searchQuery}</Text>
            {searchInputActive && <Text color={theme.colors.primary}>|</Text>}
          </Text>
        </>
      )}

      {selectedCount > 0 && (
        <>
          <Text color={theme.colors.text}> • </Text>
          <Text color={theme.colors.text}>
            Selected: <Text color={theme.colors.warning}>{selectedCount}</Text>
          </Text>
        </>
      )}
    </Box>
  );
}

export const StatusBar = React.memo(StatusBarInner);