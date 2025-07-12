import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from './ThemeProvider';

export function BranchListHeader() {
  const { theme } = useTheme();

  return (
    <Box paddingX={1} paddingY={0} borderBottom={true} borderColor={theme.colors.border}>
      {/* Selection indicator space */}
      <Box width={3}>
        <Text color={theme.colors.secondary}> </Text>
      </Box>

      {/* Branch name header */}
      <Box width={25} marginRight={2}>
        <Text color={theme.colors.secondary} bold>
          BRANCH NAME
        </Text>
      </Box>

      {/* Status header */}
      <Box width={10} marginRight={1}>
        <Text color={theme.colors.secondary} bold>
          STATUS
        </Text>
      </Box>

      {/* Time ago header */}
      <Box width={8} marginRight={1}>
        <Text color={theme.colors.secondary} bold>
          AGE
        </Text>
      </Box>

      {/* Commit hash header */}
      <Box width={8} marginRight={1}>
        <Text color={theme.colors.secondary} bold>
          COMMIT
        </Text>
      </Box>

      {/* Author header */}
      <Box width={12} marginRight={1}>
        <Text color={theme.colors.secondary} bold>
          AUTHOR
        </Text>
      </Box>

      {/* Message header - moved to far right */}
      <Box flexGrow={1}>
        <Text color={theme.colors.secondary} bold>
          MESSAGE
        </Text>
      </Box>
    </Box>
  );
}