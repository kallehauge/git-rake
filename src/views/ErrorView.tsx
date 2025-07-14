import { Box, Text } from 'ink';
import { useTheme } from '../contexts/ThemeProvider.js';
import { ViewLayout } from '../components/ViewLayout.js';

interface ErrorViewProps {
  error: string;
  currentPath: string;
  ctrlCCount?: number;
}

export function ErrorView({ error, currentPath, ctrlCCount = 0 }: ErrorViewProps) {
  const { theme } = useTheme();
  const helpText = 'ESC: exit • Ctrl+C: force exit';

  const statusBarContent = (
    <Text color={theme.colors.error} bold>
      Error
    </Text>
  );

  return (
    <ViewLayout
      statusBarContent={statusBarContent}
      helpText={helpText}
      ctrlCCount={ctrlCCount}
      currentPath={currentPath}
    >
      <Box flexDirection="column" padding={1}>
        <Text color={theme.colors.error}>Error: {error}</Text>
        <Text color={theme.colors.secondary}>Press ESC to exit</Text>
      </Box>
    </ViewLayout>
  );
}
