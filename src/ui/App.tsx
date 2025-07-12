import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { GitRepository } from '../git/GitRepository';
import { ConfigLoader } from '../utils/config';
import { GitBranch, FilterType } from '../types';
import { ThemeProvider } from './ThemeProvider';
import { BranchList } from './BranchList';
import { BranchPreview } from './BranchPreview';
import { ConfirmationPrompt } from './ConfirmationPrompt';
import { StatusBar } from './StatusBar';

interface AppProps {
  dryRun?: boolean;
  includeRemote?: boolean;
  restoreMode?: boolean;
  workingDir?: string;
}

type AppState = 'loading' | 'browsing' | 'confirming' | 'operating' | 'error';

interface StatusBarInfo {
  filterType: FilterType;
  totalBranches: number;
  filteredBranches: number;
  selectedCount: number;
  searchMode: boolean;
  searchInputActive: boolean;
  searchQuery: string;
}

export function App({ dryRun = false, includeRemote = false, restoreMode = false, workingDir }: AppProps) {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>('loading');
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<GitBranch[]>([]);
  const [previewBranch, setPreviewBranch] = useState<GitBranch | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [error, setError] = useState<string>('');
  const [gitRepo] = useState(() => new GitRepository(workingDir));
  const [config] = useState(() => new ConfigLoader().loadConfig());
  const [theme] = useState(() => new ConfigLoader().getTheme(config.theme));
  const [currentPath] = useState(() => workingDir || process.cwd());
  const [ctrlCCount, setCtrlCCount] = useState(0);
  const [statusBarInfo, setStatusBarInfo] = useState<StatusBarInfo>({
    filterType: 'all',
    totalBranches: 0,
    filteredBranches: 0,
    selectedCount: 0,
    searchMode: false,
    searchInputActive: false,
    searchQuery: '',
  });

  const loadBranches = useCallback(async () => {
    try {
      setState('loading');

      if (!(await gitRepo.isGitRepository())) {
        setError(`Not a git repository: ${currentPath}`);
        setState('error');
        return;
      }

      if (config.autoCleanupTrash) {
        await gitRepo.cleanupTrash();
      }

      let branchList: GitBranch[];
      if (restoreMode) {
        const trashBranches = await gitRepo.getTrashBranches();
        branchList = trashBranches.map(name => ({
          name,
          ref: `refs/rake-trash/${name}`,
          isCurrent: false,
          isLocal: true,
          isRemote: false,
          lastCommitDate: new Date(),
          lastCommitMessage: 'Deleted branch',
          lastCommitHash: '',
          isMerged: false,
          isStale: true,
        }));
      } else {
        branchList = await gitRepo.getAllBranches(includeRemote || config.includeRemote);
      }

      setBranches(branchList);
      setState('browsing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  }, [gitRepo, config, includeRemote, restoreMode]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useInput((input, key) => {
    // Handle ESC for exiting search/detail view but not the app
    if (key.escape) {
      if (showDetailView) {
        setShowDetailView(false);
        return;
      }
      // For other cases, ESC does nothing (double Ctrl+C exits)
      return;
    }

    if (input === 'd' && state === 'browsing' && selectedBranches.length > 0 && !restoreMode) {
      setState('confirming');
    }

    if (input === 'r' && state === 'browsing' && selectedBranches.length > 0 && restoreMode) {
      setState('confirming');
    }

    if (input === 'v' && state === 'browsing' && previewBranch) {
      setShowDetailView(!showDetailView);
    }

    // Double Ctrl+C to exit
    if (key.ctrl && input === 'c') {
      if (ctrlCCount === 0) {
        setCtrlCCount(1);
        // Reset after 2 seconds
        setTimeout(() => setCtrlCCount(0), 2000);
      } else {
        // Clear terminal and exit
        process.stdout.write('\x1b[2J\x1b[0f'); // Clear screen and move cursor to top
        exit();
      }
    }
  });

  const handleConfirmOperation = async () => {
    setState('operating');

    try {
      const operations = selectedBranches.map(branch => ({
        type: restoreMode ? 'restore' as const : 'delete' as const,
        branch,
        dryRun,
      }));

      if (!dryRun) {
        await gitRepo.performBatchOperations(operations);
      }

      await loadBranches();
      setSelectedBranches([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
      setState('error');
    }
  };

  const handleCancelOperation = () => {
    setState('browsing');
  };

  if (state === 'error') {
    return (
      <ThemeProvider theme={theme}>
        <Box flexDirection="column" padding={1}>
          <Text color={theme.colors.error}>Error: {error}</Text>
          <Text color={theme.colors.secondary}>Press ESC to exit</Text>
        </Box>
      </ThemeProvider>
    );
  }

  if (state === 'operating') {
    return (
      <ThemeProvider theme={theme}>
        <Box flexDirection="column" padding={1}>
          <Text color={theme.colors.primary}>
            {dryRun ? 'Previewing' : 'Performing'} operation...
          </Text>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box flexDirection="column">

        {/* Status bar - always render when browsing to prevent duplication */}
        <StatusBar
          key="main-status-bar"
          filterType={statusBarInfo.filterType}
          totalBranches={statusBarInfo.totalBranches}
          filteredBranches={statusBarInfo.filteredBranches}
          selectedCount={statusBarInfo.selectedCount}
          restoreMode={restoreMode}
          dryRun={dryRun}
          searchMode={statusBarInfo.searchMode}
          searchInputActive={statusBarInfo.searchInputActive}
          searchQuery={statusBarInfo.searchQuery}
        />

        {/* Main content area */}
        <Box flexGrow={1} flexDirection="column">
          {state === 'confirming' ? (
            <Box padding={1}>
              <ConfirmationPrompt
                branches={selectedBranches}
                operation={restoreMode ? 'restore' : 'delete'}
                dryRun={dryRun}
                onConfirm={handleConfirmOperation}
                onCancel={handleCancelOperation}
              />
            </Box>
          ) : showDetailView ? (
            <BranchPreview branch={previewBranch} gitRepo={gitRepo} />
          ) : (
            <BranchList
              branches={branches}
              onBranchesSelected={setSelectedBranches}
              onPreviewBranch={setPreviewBranch}
              onStatusBarChange={setStatusBarInfo}
              loading={state === 'loading'}
              restoreMode={restoreMode}
              dryRun={dryRun}
            />
          )}
        </Box>

        {/* Combined help bar */}
        <Box borderStyle="single" borderColor={theme.colors.secondary}>
          <Text color={theme.colors.secondary}>
            {state === 'confirming' ? (
              '←→: navigate • Enter/Y: confirm • ESC/N: cancel'
            ) : showDetailView ? (
              'v: back to list • Ctrl+C: exit'
            ) : (
              `↑↓: navigate • Space: select • /: search • f: filter • v: details • ${restoreMode ? 'r: restore' : 'd: delete'} • Ctrl+C: exit`
            )}
            {ctrlCCount > 0 && (
              <Text color={theme.colors.warning}> (Press Ctrl+C again to exit)</Text>
            )}
          </Text>
        </Box>

        {/* Repository info at bottom */}
        <Box paddingX={1}>
          <Text color={theme.colors.secondary}>
            Cwd: {currentPath}
          </Text>
        </Box>
      </Box>
    </ThemeProvider>
  );
}