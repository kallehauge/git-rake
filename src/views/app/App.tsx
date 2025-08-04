import { ViewManager } from './ViewManager.js'
import { GitRepository } from '@services/GitRepository.js'
import { useRepositoryLoader } from './hooks/useRepositoryLoader.js'
import { AppUIProvider } from '@contexts/AppUIContext.js'
import { SearchProvider } from '@contexts/SearchContext.js'
import { BranchesSelectionProvider } from '@contexts/BranchesSelectionContext.js'
import { ErrorView } from '@views/error/ErrorView.js'
import { StrictMode, useMemo, useEffect, useRef } from 'react'
import type { GitRakeConfig } from '@utils/config.types.js'
import { useTrashCleanup } from './hooks/useTrashCleanup.js'

type AppProps = {
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
    () => new GitRepository(config, workingDir),
    [config, workingDir],
  )
  const currentPath = workingDir || process.cwd()

  const { branches, error, loadBranches, loading } = useRepositoryLoader({
    gitRepo,
    config: config,
    includeRemote: includeRemote || false,
    restoreMode: restoreMode || false,
    currentPath,
  })

  const performTrashCleanup = useTrashCleanup({ gitRepo, config })
  const hasCleanedRef = useRef(false)

  useEffect(() => {
    if (branches.length > 0 && !hasCleanedRef.current) {
      hasCleanedRef.current = true
      performTrashCleanup()
    }
  }, [branches.length, performTrashCleanup])

  if (error) {
    return <ErrorView error={error} currentPath={currentPath} />
  }

  return (
    <StrictMode>
      <AppUIProvider config={config}>
        <SearchProvider>
          <BranchesSelectionProvider branches={branches}>
            <ViewManager
              restoreMode={restoreMode || false}
              gitRepo={gitRepo}
              currentPath={currentPath}
              loading={loading}
              refreshBranches={loadBranches}
            />
          </BranchesSelectionProvider>
        </SearchProvider>
      </AppUIProvider>
    </StrictMode>
  )
}
