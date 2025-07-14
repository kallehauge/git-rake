import { Box, Text } from 'ink';
import { useTheme } from '../contexts/ThemeProvider.js';
import { ViewLayout } from '../components/ViewLayout.js';

interface OperatingViewProps {
  dryRun: boolean;
  currentPath: string;
  ctrlCCount: number;
}

export function OperatingView({ dryRun, currentPath, ctrlCCount }: OperatingViewProps) {
  const { theme } = useTheme();
  const helpText = 'Please wait...';

  const statusBarContent = (
    <Text color={theme.colors.primary} bold>
      {dryRun ? 'Previewing' : 'Processing'}
    </Text>
  );

  return (
    <ViewLayout
      statusBarContent={statusBarContent}
      dryRun={dryRun}
      helpText={helpText}
      ctrlCCount={ctrlCCount}
      currentPath={currentPath}
    >
      <Box flexDirection="column" padding={1}>
        <Text color={theme.colors.primary}>
          {dryRun ? 'Previewing' : 'Performing'} operation...
        </Text>
      </Box>
    </ViewLayout>
  );
}
