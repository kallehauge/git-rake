import { AppProviders } from '@contexts/AppProviders.js'
import { AppContainer } from './AppContainer.js'
import { useGitRepository } from '@hooks/useGitRepository.js'
import { useBranches } from '@hooks/useBranches.js'
import { ThemeProvider } from '@contexts/ThemeProvider.js'
import { ErrorView } from '@views/error/ErrorView.js'
import React, { StrictMode } from 'react'

interface AppProps {
  includeRemote?: boolean
  restoreMode?: boolean
  workingDir?: string
}

export function App(props: AppProps) {
  const { gitRepo, config, theme, currentPath } = useGitRepository({
    workingDir: props.workingDir,
  })
  const { branches, error, loadBranches } = useBranches({
    gitRepo,
    config,
    includeRemote: props.includeRemote || false,
    restoreMode: props.restoreMode || false,
    currentPath,
  })

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <ErrorView error={error} currentPath={currentPath} />
      </ThemeProvider>
    )
  }

  const onRender = (
    id: string,
    phase: string,
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
  ) => {
    console.log(id, phase, actualDuration, baseDuration, startTime, commitTime)
  }

  const content = (
    <ThemeProvider theme={theme}>
      <AppProviders branches={branches}>
        <AppContainer {...props} onRefreshBranches={loadBranches} />
      </AppProviders>
    </ThemeProvider>
  )

  return (
    <StrictMode>
      {process.env.DEV ? (
        <React.Profiler id="app" onRender={onRender}>
          {content}
        </React.Profiler>
      ) : (
        content
      )}
    </StrictMode>
  )
}
