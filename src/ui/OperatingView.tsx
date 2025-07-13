import { Box, Text } from 'ink';
import { useTheme } from './ThemeProvider.js';

interface OperatingViewProps {
  dryRun: boolean;
}

export function OperatingView({ dryRun }: OperatingViewProps) {
  const { theme } = useTheme();

  return (
    <Box flexDirection="column" padding={1}>
      <Text color={theme.colors.primary}>
        {dryRun ? 'Previewing' : 'Performing'} operation...
      </Text>
    </Box>
  );
}
