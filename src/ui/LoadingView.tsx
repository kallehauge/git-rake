import { Box, Text } from 'ink';
import { useTheme } from './ThemeProvider.js';

export function LoadingView() {
  const { theme } = useTheme();

  return (
    <Box flexDirection="column" padding={1}>
      <Text color={theme.colors.primary}>
        Previewing operation...
      </Text>
    </Box>
  );
}
