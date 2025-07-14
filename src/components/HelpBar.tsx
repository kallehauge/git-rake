import { Box, Text } from 'ink';
import { useTheme } from '../contexts/ThemeProvider.js';

interface HelpBarProps {
  helpText: string;
  ctrlCCount?: number;
}

export function HelpBar({ helpText, ctrlCCount = 0 }: HelpBarProps) {
  const { theme } = useTheme();

  return (
    <Box borderStyle="single" borderColor={theme.colors.secondary}>
      <Text color={theme.colors.secondary}>
        {helpText}
        {ctrlCCount > 0 && (
          <Text color={theme.colors.warning}> (Press Ctrl+C again to exit)</Text>
        )}
      </Text>
    </Box>
  );
}
