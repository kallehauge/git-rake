import { AppStateProvider } from '../contexts/AppStateContext.js';
import { AppContainer } from './AppContainer.js';
import { useGitRepository } from '../hooks/useGitRepository.js';
import { useBranches } from '../hooks/useBranches.js';
import { ThemeProvider } from './ThemeProvider.js';
import { ErrorView } from './ErrorView.js';

interface AppProps {
  dryRun?: boolean;
  includeRemote?: boolean;
  restoreMode?: boolean;
  workingDir?: string;
}

export function App(props: AppProps) {
  const { gitRepo, config, theme, currentPath } = useGitRepository({ workingDir: props.workingDir });
  const { branches, error, loadBranches } = useBranches({
    gitRepo,
    config,
    includeRemote: props.includeRemote || false,
    restoreMode: props.restoreMode || false,
    currentPath,
  });

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <ErrorView error={error} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <AppStateProvider branches={branches}>
        <AppContainer {...props} onRefreshBranches={loadBranches} />
      </AppStateProvider>
    </ThemeProvider>
  );
}
