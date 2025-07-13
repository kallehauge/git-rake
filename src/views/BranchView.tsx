import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { GitRepository } from '../services/GitRepository.js';
import { useBranchDataContext } from '../contexts/AppProviders.js';
import { useTheme } from '../contexts/ThemeProvider.js';

interface BranchViewProps {
  gitRepo: GitRepository;
}

export const BranchView = React.memo(function BranchView({
  gitRepo,
}: BranchViewProps) {
  const { theme } = useTheme();
  const { currentBranch } = useBranchDataContext();
  const [gitLog, setGitLog] = useState<string>('');
  const [loadingGitLog, setLoadingGitLog] = useState(false);

  useEffect(() => {
    if (!currentBranch) {
      setGitLog('');
      return;
    }

    setLoadingGitLog(true);
    gitRepo.getBranchLog(currentBranch.name, 15)
      .then(setGitLog)
      .catch(() => setGitLog('Failed to load branch log'))
      .finally(() => setLoadingGitLog(false));
  }, [currentBranch, gitRepo]);

  if (!currentBranch) {
    return (
      <Box flexDirection="column" height="100%">
        <Box paddingX={1} paddingY={1}>
          <Text color={theme.colors.primary} bold>Branch Preview</Text>
        </Box>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color={theme.colors.secondary}>Select a branch to view details</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <Box paddingX={1} paddingY={1}>
        <Text color={theme.colors.primary} bold>{currentBranch.name}</Text>
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text color={theme.colors.text}>
          <Text color={theme.colors.secondary}>Status: </Text>
          {currentBranch.isCurrent && <Text color={theme.colors.primary}>Current</Text>}
          {currentBranch.isMerged && !currentBranch.isCurrent && <Text color={theme.colors.success}>Merged</Text>}
          {!currentBranch.isMerged && !currentBranch.isCurrent && <Text color={theme.colors.warning}>Unmerged</Text>}
          {currentBranch.isStale && (
            <Text color={theme.colors.warning}> • Stale ({currentBranch.staleDays} days)</Text>
          )}
        </Text>

        <Text color={theme.colors.text}>
          <Text color={theme.colors.secondary}>Type: </Text>
          {currentBranch.isLocal ? 'Local' : 'Remote'}
        </Text>

        <Text color={theme.colors.text}>
          <Text color={theme.colors.secondary}>Last Commit: </Text>
          {currentBranch.lastCommitHash.substring(0, 8)}
        </Text>

        {currentBranch.lastCommitAuthor && (
          <Text color={theme.colors.text}>
            <Text color={theme.colors.secondary}>Author: </Text>
            {currentBranch.lastCommitAuthor}
          </Text>
        )}

        {(currentBranch.aheadBy !== undefined || currentBranch.behindBy !== undefined) && (
          <Text color={theme.colors.text}>
            <Text color={theme.colors.secondary}>Relationship: </Text>
            {currentBranch.aheadBy !== undefined && currentBranch.aheadBy > 0 && (
              <Text color={theme.colors.success}>+{currentBranch.aheadBy} ahead</Text>
            )}
            {currentBranch.aheadBy !== undefined && currentBranch.behindBy !== undefined &&
             currentBranch.aheadBy > 0 && currentBranch.behindBy > 0 && <Text>, </Text>}
            {currentBranch.behindBy !== undefined && currentBranch.behindBy > 0 && (
              <Text color={theme.colors.warning}>-{currentBranch.behindBy} behind</Text>
            )}
            {currentBranch.aheadBy === 0 && currentBranch.behindBy === 0 && (
              <Text color={theme.colors.success}>up to date</Text>
            )}
          </Text>
        )}
      </Box>

      <Box paddingX={1} paddingY={1} borderTop={true} borderColor={theme.colors.border}>
        <Text color={theme.colors.primary} bold>Recent Commits</Text>
      </Box>

      <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
        {loadingGitLog ? (
          <Text color={theme.colors.secondary}>Loading...</Text>
        ) : (
          <Text color={theme.colors.text}>{gitLog}</Text>
        )}
      </Box>
    </Box>
  );
});
