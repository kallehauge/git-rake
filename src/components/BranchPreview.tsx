import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { GitBranch } from '../types/index.js';
import { useTheme } from '../contexts/ThemeProvider.js';
import { GitRepository } from '../services/GitRepository.js';

interface BranchPreviewProps {
  branch: GitBranch | null;
  gitRepo: GitRepository;
}

export function BranchPreview({ branch, gitRepo }: BranchPreviewProps) {
  const { theme } = useTheme();
  const [log, setLog] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!branch) {
      setLog('');
      return;
    }

    setLoading(true);
    gitRepo.getBranchLog(branch.name, 15)
      .then(setLog)
      .catch(() => setLog('Failed to load branch log'))
      .finally(() => setLoading(false));
  }, [branch, gitRepo]);

  if (!branch) {
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
        <Text color={theme.colors.primary} bold>{branch.name}</Text>
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text color={theme.colors.text}>
          <Text color={theme.colors.secondary}>Status: </Text>
          {branch.isCurrent && <Text color={theme.colors.primary}>Current</Text>}
          {branch.isMerged && !branch.isCurrent && <Text color={theme.colors.success}>Merged</Text>}
          {!branch.isMerged && !branch.isCurrent && <Text color={theme.colors.warning}>Unmerged</Text>}
          {branch.isStale && (
            <Text color={theme.colors.warning}> • Stale ({branch.staleDays} days)</Text>
          )}
        </Text>

        <Text color={theme.colors.text}>
          <Text color={theme.colors.secondary}>Type: </Text>
          {branch.isLocal ? 'Local' : 'Remote'}
        </Text>

        <Text color={theme.colors.text}>
          <Text color={theme.colors.secondary}>Last Commit: </Text>
          {branch.lastCommitHash.substring(0, 8)}
        </Text>

        {branch.lastCommitAuthor && (
          <Text color={theme.colors.text}>
            <Text color={theme.colors.secondary}>Author: </Text>
            {branch.lastCommitAuthor}
          </Text>
        )}

        {(branch.aheadBy !== undefined || branch.behindBy !== undefined) && (
          <Text color={theme.colors.text}>
            <Text color={theme.colors.secondary}>Relationship: </Text>
            {branch.aheadBy !== undefined && branch.aheadBy > 0 && (
              <Text color={theme.colors.success}>+{branch.aheadBy} ahead</Text>
            )}
            {branch.aheadBy !== undefined && branch.behindBy !== undefined &&
             branch.aheadBy > 0 && branch.behindBy > 0 && <Text>, </Text>}
            {branch.behindBy !== undefined && branch.behindBy > 0 && (
              <Text color={theme.colors.warning}>-{branch.behindBy} behind</Text>
            )}
            {branch.aheadBy === 0 && branch.behindBy === 0 && (
              <Text color={theme.colors.success}>up to date</Text>
            )}
          </Text>
        )}
      </Box>

      <Box paddingX={1} paddingY={1} borderTop={true} borderColor={theme.colors.border}>
        <Text color={theme.colors.primary} bold>Recent Commits</Text>
      </Box>

      <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
        {loading ? (
          <Text color={theme.colors.secondary}>Loading...</Text>
        ) : (
          <Text color={theme.colors.text}>{log}</Text>
        )}
      </Box>
    </Box>
  );
}
