import { Box, Text } from 'ink';
import { useTheme } from '../contexts/ThemeProvider.js';
import { useBranchDataContext } from '../contexts/AppProviders.js';

interface StatusBarProps {
  restoreMode?: boolean;
  dryRun?: boolean;
}

function StatusBarInner({ restoreMode = false, dryRun = false }: StatusBarProps) {
  const { statusBarInfo } = useBranchDataContext();
  const { filterType, totalBranches, filteredBranches, selectedCount, searchMode, searchInputActive, searchQuery } = statusBarInfo;
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

export const StatusBar = StatusBarInner;
