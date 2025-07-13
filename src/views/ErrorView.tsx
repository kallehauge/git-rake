import { Box, Text } from 'ink';
import { useTheme } from '../contexts/ThemeProvider.js';

interface ErrorViewProps {
  error: string;
}

export function ErrorView({ error }: ErrorViewProps) {
  const { theme } = useTheme();

  return (
    <Box flexDirection="column" padding={1}>
      <Text color={theme.colors.error}>Error: {error}</Text>
      <Text color={theme.colors.secondary}>Press ESC to exit</Text>
    </Box>
  );
}
