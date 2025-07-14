import { Box, Text } from 'ink';
import { useTheme } from '../contexts/ThemeProvider.js';
import { ViewLayout } from '../components/ViewLayout.js';

interface LoadingViewProps {
  currentPath?: string;
  ctrlCCount?: number;
}

export function LoadingView({ currentPath = '', ctrlCCount = 0 }: LoadingViewProps) {
  const { theme } = useTheme();
  const helpText = 'Loading...';

  const statusBarContent = (
    <Text color={theme.colors.primary} bold>
      Loading
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
        <Text color={theme.colors.primary}>
          Loading...
        </Text>
      </Box>
    </ViewLayout>
  );
}
