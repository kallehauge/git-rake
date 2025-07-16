import { Box, Text } from 'ink';
import { useTheme } from '@contexts/ThemeProvider.js';

export function ExitWarning() {
  const { theme } = useTheme();

  return (
    <Box paddingX={1} paddingY={0}>
      <Text color={theme.colors.warning}>
        Press Ctrl+C again to exit
      </Text>
    </Box>
  );
}
