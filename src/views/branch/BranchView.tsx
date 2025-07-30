import React, { useState, useEffect, useMemo } from 'react'
import { Box, Text, useInput } from 'ink'
import { GitRepository } from '@services/GitRepository.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { ViewLayout } from '@views/app/ViewLayout.js'
import { Spinner } from '@components/Spinner.js'
import { getBranchStatus } from '@utils/branchUtils.js'

type BranchViewProps = {
  gitRepo: GitRepository
  currentPath: string
}

export const BranchView = React.memo(function BranchView({
  gitRepo,
  currentPath,
}: BranchViewProps) {
  const { theme, setCurrentView, inputLocked } = useAppUIContext()
  const { currentBranch } = useBranchDataContext()
  const [gitLog, setGitLog] = useState<string>('')
  const [loadingGitLog, setLoadingGitLog] = useState(false)

  useEffect(() => {
    if (!currentBranch) {
      setGitLog('')
      return
    }

    setLoadingGitLog(true)
    gitRepo
      .getBranchLog(currentBranch.ref, 15)
      .then(setGitLog)
      .catch(() => setGitLog('Failed to load branch log'))
      .finally(() => setLoadingGitLog(false))
  }, [currentBranch, gitRepo])

  useInput(
    (input, key) => {
      if (key.escape) {
        setCurrentView('branches')
      }
    },
    { isActive: !inputLocked },
  )

  const helpText = 'ESC: back to branches'

  const statusBarContent = (
    <Text color={theme.colors.text}>{currentBranch?.name}</Text>
  )

  const statusInfo = useMemo(() => {
    if (!currentBranch) {
      return { text: 'Loading...', color: 'white' }
    }

    return getBranchStatus(currentBranch, theme)
  }, [currentBranch, theme])

  if (!currentBranch) {
    return (
      <ViewLayout
        statusBarContent={statusBarContent}
        helpText={helpText}
        currentPath={currentPath}
      >
        <Box flexDirection="column">
          <Box paddingX={1} paddingY={1}>
            <Text color={theme.colors.primary} bold>
              Branch Preview
            </Text>
          </Box>
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Text color={theme.colors.secondary}>
              Select a branch to view details
            </Text>
          </Box>
        </Box>
      </ViewLayout>
    )
  }

  return (
    <ViewLayout
      statusBarContent={statusBarContent}
      helpText={helpText}
      currentPath={currentPath}
    >
      <Box flexDirection="column">
        <Box flexDirection="column" paddingX={1} paddingY={1}>
          <Box flexDirection="row">
            <Text color={theme.colors.primary}>Status: </Text>
            <Text color={statusInfo.color} wrap="truncate-end">
              {statusInfo.text}
            </Text>
          </Box>

          <Box flexDirection="row">
            <Text color={theme.colors.primary}>Remote: </Text>
            <Text color={theme.colors.text}>
              {!currentBranch.isRemote ? 'Local' : 'Remote'}
            </Text>
          </Box>

          {currentBranch.lastCommitAuthor && (
            <Box flexDirection="row">
              <Text color={theme.colors.primary}>Author: </Text>
              <Text color={theme.colors.text}>
                {currentBranch.lastCommitAuthor}
              </Text>
            </Box>
          )}

          {!currentBranch.isRemote && (
            <Box flexDirection="row">
              <Text color={theme.colors.primary}>Tracking: </Text>
              {currentBranch.upstreamBranch !== null ? (
                <>
                  <Text color={theme.colors.text}>
                    {currentBranch.upstreamBranch}
                  </Text>
                  {currentBranch.upstreamTrack !== null && (
                    <Text color={theme.colors.warning}>
                      {' '}
                      {currentBranch.upstreamTrack}
                    </Text>
                  )}
                </>
              ) : (
                <Text color={theme.colors.muted}>No upstream</Text>
              )}
            </Box>
          )}
        </Box>

        <Box
          paddingX={1}
          paddingY={1}
          borderTop={true}
          borderColor={theme.colors.border}
        >
          <Text color={theme.colors.primary} bold>
            Recent Commits
          </Text>
        </Box>

        <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
          {loadingGitLog ? (
            <Spinner text="Loading branch log..." />
          ) : (
            <Text color={theme.colors.text}>{gitLog}</Text>
          )}
        </Box>
      </Box>
    </ViewLayout>
  )
})
