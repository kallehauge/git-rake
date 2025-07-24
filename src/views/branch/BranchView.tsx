import React, { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { GitRepository } from '@services/GitRepository.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { ViewLayout } from '@views/app/ViewLayout.js'
import { Spinner } from '@components/Spinner.js'
import { TrackingStatus } from './TrackingStatus.js'

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
  const [aheadBehindData, setAheadBehindData] = useState<
    | {
        aheadBy: number
        behindBy: number
      }
    | null
    | 'not-applicable'
  >(null)
  const [loadingAheadBehind, setLoadingAheadBehind] = useState(false)

  useEffect(() => {
    if (!currentBranch) {
      setGitLog('')
      setAheadBehindData(null)
      return
    }

    setLoadingGitLog(true)
    gitRepo
      .getBranchLog(currentBranch.name, 15)
      .then(setGitLog)
      .catch(() => setGitLog('Failed to load branch log'))
      .finally(() => setLoadingGitLog(false))
  }, [currentBranch, gitRepo])

  useEffect(() => {
    if (!currentBranch || !currentBranch.isLocal) {
      setAheadBehindData('not-applicable')
      return
    }

    setLoadingAheadBehind(true)
    gitRepo
      .getBranchAheadBehind(currentBranch.name)
      .then(data => setAheadBehindData(data || 'not-applicable'))
      .catch(() => setAheadBehindData(null))
      .finally(() => setLoadingAheadBehind(false))
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
          <Text color={theme.colors.text}>
            <Text color={theme.colors.secondary}>Status: </Text>
            {currentBranch.isCurrent && (
              <Text color={theme.colors.primary}>Current</Text>
            )}
            {currentBranch.isMerged && !currentBranch.isCurrent && (
              <Text color={theme.colors.success}>Merged</Text>
            )}
            {!currentBranch.isMerged && !currentBranch.isCurrent && (
              <Text color={theme.colors.warning}>Unmerged</Text>
            )}
            {currentBranch.isStale && (
              <Text color={theme.colors.warning}>
                {' '}
                • Stale ({currentBranch.staleDays} days)
              </Text>
            )}
          </Text>

          <Text color={theme.colors.text}>
            <Text color={theme.colors.secondary}>Type: </Text>
            {currentBranch.isLocal ? 'Local' : 'Remote'}
          </Text>

          <Text color={theme.colors.text}>
            <Text color={theme.colors.secondary}>Last Commit: </Text>
            {currentBranch.lastCommitHash.substring(0, 8)}
          </Text>

          {currentBranch.lastCommitAuthor && (
            <Text color={theme.colors.text}>
              <Text color={theme.colors.secondary}>Author: </Text>
              {currentBranch.lastCommitAuthor}
            </Text>
          )}

          {currentBranch.isLocal && (
            <Text color={theme.colors.text}>
              <Text color={theme.colors.secondary}>Tracking: </Text>
              <TrackingStatus
                loading={loadingAheadBehind}
                data={aheadBehindData}
              />
            </Text>
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
