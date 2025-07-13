import { Box, Text, useInput } from 'ink';
import { useTheme } from './ThemeProvider.js';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onExit: () => void;
}

export function SearchInput({ value, onChange, onExit }: SearchInputProps) {
  const { theme } = useTheme();

  useInput((input, key) => {
    // Allow Ctrl+C to pass through to App component for exit handling
    if (key.ctrl && input === 'c') {
      return;
    }

    if (key.escape) {
      onExit();
      return;
    }

    if (key.backspace) {
      onChange(value.slice(0, -1));
      return;
    }

    if (key.delete) {
      onChange('');
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      onChange(value + input);
    }
  });

  return (
    <Box borderStyle="single" borderColor={theme.colors.primary} paddingX={1}>
      <Text color={theme.colors.primary}>Search: </Text>
      <Text color={theme.colors.text}>{value}</Text>
      <Text color={theme.colors.text}>|</Text>
      <Box marginLeft={2}>
        <Text color={theme.colors.secondary}>ESC: exit</Text>
      </Box>
    </Box>
  );
}
