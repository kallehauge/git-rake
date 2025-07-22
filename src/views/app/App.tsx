import { ViewManager } from './ViewManager.js'
import { GitRepository } from '@services/GitRepository.js'
import { useBranches } from '@hooks/useBranches.js'
import { AppUIProvider, useAppUIContext } from '@contexts/AppUIContext.js'
import { SearchProvider } from '@contexts/SearchContext.js'
import { SelectionProvider } from '@contexts/SelectionContext.js'
import { BranchDataProvider } from '@contexts/BranchDataContext.js'
import { ErrorView } from '@views/error/ErrorView.js'
import { StrictMode, useMemo } from 'react'

interface AppProps {
  includeRemote?: boolean
  restoreMode?: boolean
  workingDir?: string
}

export function App(props: AppProps) {
  const { config } = useAppUIContext()

  const gitRepo = useMemo(
    () => new GitRepository(props.workingDir, config),
    [props.workingDir, config],
  )
  const currentPath = props.workingDir || process.cwd()
  const restoreMode = props.restoreMode || false

  const { branches, error, loadBranches } = useBranches({
    gitRepo,
    config,
    includeRemote: props.includeRemote || false,
    restoreMode,
    currentPath,
  })

  if (error) {
    return <ErrorView error={error} currentPath={currentPath} />
  }

  return (
    <StrictMode>
      <AppUIProvider>
        <SearchProvider>
          <SelectionProvider>
            <BranchDataProvider
              branches={branches}
              onRefreshBranches={loadBranches}
            >
              <ViewManager
                restoreMode={restoreMode}
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
