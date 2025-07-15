import { Text } from 'ink';
import { useTheme } from '../../contexts/ThemeProvider.js';
import { useBranchDataContext } from '../../contexts/AppProviders.js';

export function BranchStatusBarContent() {
  const { statusBarInfo } = useBranchDataContext();
  const { filterType, totalBranches, filteredBranches, selectedCount, searchMode, searchQuery } = statusBarInfo;
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
    <>
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
            {searchMode && <Text color={theme.colors.primary}>|</Text>}
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
    </>
  );
}
