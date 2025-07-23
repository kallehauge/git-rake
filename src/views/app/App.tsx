import { ViewManager } from './ViewManager.js'
import { GitRepository } from '@services/GitRepository.js'
import { useRepositoryLoader } from './hooks/useRepositoryLoader.js'
import { AppUIProvider } from '@contexts/AppUIContext.js'
import { SearchProvider } from '@contexts/SearchContext.js'
import { SelectionProvider } from '@contexts/SelectionContext.js'
import { BranchDataProvider } from '@contexts/BranchDataContext.js'
import { ErrorView } from '@views/error/ErrorView.js'
import { StrictMode, useMemo } from 'react'
import { GitRakeConfig } from '@utils/config.js'

interface AppProps {
  config: GitRakeConfig
  includeRemote?: boolean
  restoreMode?: boolean
  workingDir?: string
}

export function App({
  config,
  restoreMode,
  workingDir,
  includeRemote,
}: AppProps) {
  const gitRepo = useMemo(
    () => new GitRepository(workingDir, config),
    [workingDir, config],
  )
  const currentPath = workingDir || process.cwd()

  const { branches, error, loadBranches } = useRepositoryLoader({
    gitRepo,
    config: config,
    includeRemote: includeRemote || false,
    restoreMode: restoreMode || false,
    currentPath,
  })

  if (error) {
    return <ErrorView error={error} currentPath={currentPath} />
  }

  return (
    <StrictMode>
      <AppUIProvider config={config}>
        <SearchProvider>
          <SelectionProvider>
            <BranchDataProvider
              branches={branches}
              onRefreshBranches={loadBranches}
            >
              <ViewManager
                restoreMode={restoreMode || false}
                gitRepo={gitRepo}
                currentPath={currentPath}
              />
            </BranchDataProvider>
          </SelectionProvider>
        </SearchProvider>
      </AppUIProvider>
    </StrictMode>
  )
}
