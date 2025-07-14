import { ReactNode } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../contexts/ThemeProvider.js';
import { StatusBar } from './StatusBar.js';
import { HelpBar } from './HelpBar.js';

interface ViewLayoutProps {
  children: ReactNode;
  statusBarContent?: ReactNode;
  restoreMode?: boolean;
  dryRun?: boolean;
  helpText: string;
  ctrlCCount?: number;
  currentPath: string;
}

export function ViewLayout({
  children,
  statusBarContent,
  restoreMode = false,
  dryRun = false,
  helpText,
  ctrlCCount = 0,
  currentPath
}: ViewLayoutProps) {
  const { theme } = useTheme();

  return (
    <Box flexDirection="column">
      <StatusBar restoreMode={restoreMode} dryRun={dryRun}>
        {statusBarContent}
      </StatusBar>

      <Box flexGrow={1} flexDirection="column">
        {children}
      </Box>

      <HelpBar helpText={helpText} ctrlCCount={ctrlCCount} />

      <Box paddingX={1}>
        <Text color={theme.colors.secondary}>
          Cwd: {currentPath}
        </Text>
      </Box>
    </Box>
  );
}
