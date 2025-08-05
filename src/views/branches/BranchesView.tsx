import React, { useMemo } from 'react'
import { Box, Text, useInput } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { useSearchContext } from '@contexts/SearchContext.js'
import { useBranchesSearch } from './hooks/useBranchesSearch.js'
import { useBranchesOperations } from './hooks/useBranchesOperations.js'
import {
  BRANCH_OPERATIONS,
  OPERATION_CONFIRMATION_CONFIG,
} from './constants.js'
import { useBranchesState } from './hooks/useBranchesState.js'
import { GitRepository } from '@services/GitRepository.js'
import { BranchesList } from './BranchesList.js'
import { ViewLayout } from '@views/app/ViewLayout.js'
import { Spinner } from '@components/Spinner.js'
import { BranchesStatusBar } from './BranchesStatusBar.js'

type BranchesViewProps = {
  restoreMode: boolean
  currentPath: string
  gitRepo: GitRepository
  loading: boolean
  refreshBranches: () => Promise<void>
}

export const BranchesView = React.memo(function BranchesView({
  restoreMode,
  currentPath,
  gitRepo,
  loading,
  refreshBranches,
}: BranchesViewProps) {
  const { inputLocked, setCurrentView, theme } = useAppUIContext()
  const { filterType } = useSearchContext()
  const { handleSearchInput, activateSearch, cycleFilter } = useBranchesSearch()
  const {
    availableBranches,
    selectedBranches,
    selectAllAvailableBranches,
    handleListNavigation,
  } = useBranchesState()
  const {
    pendingOperation,
    enterConfirmationMode,
    executeOperationAndExit,
    exitConfirmationMode,
  } = useBranchesOperations(gitRepo, selectedBranches, refreshBranches)

  useInput((input, key) => {
    if (loading) return

    // During confirmation: only allow up/down navigation within selected branches
    if (pendingOperation) {
      if (handleListNavigation(key)) {
        return
      }
      // Block all other input during confirmation
      return
    }

    if (handleSearchInput(input, key)) return

    // Prevent "normal" navigation from happening while we're in "search mode".
    if (inputLocked) return

    if (input === '/') {
      activateSearch()
      return
    }

    if (input === 'f') {
      cycleFilter()
      return
    }

    if (input === 'a') {
      selectAllAvailableBranches()
      return
    }

    if (key.return) {
      setCurrentView('branch')
      return
    }

    if (input === 't' && selectedBranches.length > 0 && !restoreMode) {
      enterConfirmationMode(BRANCH_OPERATIONS.TRASH)
      return
    }

    if (input === 'd' && selectedBranches.length > 0 && !restoreMode) {
      enterConfirmationMode(BRANCH_OPERATIONS.DELETE)
      return
    }

    if (input === 'r' && selectedBranches.length > 0 && restoreMode) {
      enterConfirmationMode(BRANCH_OPERATIONS.RESTORE)
      return
    }
  })

  const statusBarType = pendingOperation
    ? OPERATION_CONFIRMATION_CONFIG[pendingOperation].type
    : 'default'

  const helpText = useMemo(() => {
    if (pendingOperation) {
      return '↑↓: navigate • s: deselect • Y/Enter: confirm • N/Esc: cancel'
    }
    return `↑↓: navigate • s: select • a: select all • /: search • f: filter • enter: details • ${restoreMode ? 'r: restore' : 't: trash • d: delete permanently'}`
  }, [pendingOperation, restoreMode])

  const statusBarContent = (
    <BranchesStatusBar
      pendingOperation={pendingOperation}
      selectedBranches={selectedBranches}
      onConfirm={executeOperationAndExit}
      onCancel={exitConfirmationMode}
    />
  )

  return (
    <ViewLayout
      statusBarContent={statusBarContent}
      statusBarType={statusBarType}
      helpText={helpText}
      currentPath={currentPath}
    >
      <Box flexGrow={1} flexDirection="column">
        {availableBranches.length === 0 ? (
          loading ? (
            <Box justifyContent="center" alignItems="center" flexGrow={1}>
              <Spinner text="Loading branches..." />
            </Box>
          ) : (
            <Box justifyContent="center" alignItems="center" flexGrow={1}>
              <Text color={theme.colors.text}>
                {filterType === 'selected' && selectedBranches.length === 0
                  ? 'No branches selected'
                  : 'No branches found'}
              </Text>
            </Box>
          )
        ) : (
          <>
            <BranchesList branches={availableBranches} />
          </>
        )}
      </Box>
    </ViewLayout>
  )
})
