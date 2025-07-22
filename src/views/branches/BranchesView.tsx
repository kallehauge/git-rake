import React from 'react'
import { Box, Text, useInput } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'
import { useBranchesSearch } from './hooks/useBranchesSearch.js'
import { useBranchesSelection } from './hooks/useBranchesSelection.js'
import {
  useBranchesOperations,
  UI_OPERATIONS,
} from './hooks/useBranchesOperations.js'
import { useBranchesDisplay } from './hooks/useBranchesDisplay.js'
import { GitRepository } from '@services/GitRepository.js'
import { BranchesList } from './BranchesList.js'
import { ViewLayout } from '@views/app/ViewLayout.js'
import { BranchesStatusBarContent } from './BranchesStatusBarContent.js'
import { Spinner } from '@components/Spinner.js'
import {
  ConfirmationBar,
  CONFIRMATION_SHORTCUTS,
} from '@components/ConfirmationBar.js'

interface BranchesViewProps {
  restoreMode: boolean
  currentPath: string
  gitRepo: GitRepository
}

export const BranchesView = React.memo(function BranchesView({
  restoreMode,
  currentPath,
  gitRepo,
}: BranchesViewProps) {
  const { inputLocked, setCurrentView, theme } = useAppUIContext()
  const {
    selectedBranches,
    branches,
    refreshBranches,
    filteredBranches: contextFilteredBranches,
    statusBarInfo,
    isRefreshing,
  } = useBranchDataContext()
  const { handleSearchInput, activateSearch, cycleFilter } = useBranchesSearch()
  const { selectAllVisibleBranches } = useBranchesSelection()
  const {
    pendingOperation,
    startConfirmation,
    handleConfirm,
    handleCancel,
    confirmationConfig,
  } = useBranchesOperations(gitRepo)
  const { branchesToDisplay, statusBarProps } = useBranchesDisplay({
    pendingOperation,
    selectedBranches,
    contextFilteredBranches,
    statusBarInfo,
    branches,
    theme,
  })

  useInput((input, key) => {
    if (isRefreshing || pendingOperation) return

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
      selectAllVisibleBranches()
      return
    }

    if (key.return) {
      setCurrentView('branch')
      return
    }

    if (input === 't' && selectedBranches.length > 0 && !restoreMode) {
      startConfirmation(UI_OPERATIONS.TRASH)
      return
    }

    if (input === 'd' && selectedBranches.length > 0 && !restoreMode) {
      startConfirmation(UI_OPERATIONS.DELETE)
      return
    }

    if (input === 'r' && selectedBranches.length > 0 && restoreMode) {
      startConfirmation(UI_OPERATIONS.RESTORE)
      return
    }
  })

  const handleConfirmWrapper = async () => {
    await handleConfirm(selectedBranches, refreshBranches)
  }

  const branchesHelpText = `↑↓: navigate • space: select • a: select all • /: search • f: filter • enter: details • ${restoreMode ? 'r: restore' : 't: trash • d: delete permanently'}`
  const confirmationHelpText = `${CONFIRMATION_SHORTCUTS.navigate}: navigate • ${CONFIRMATION_SHORTCUTS.confirm}: confirm • ${CONFIRMATION_SHORTCUTS.cancel}: cancel`
  const helpText = pendingOperation ? confirmationHelpText : branchesHelpText

  return (
    <ViewLayout
      statusBarContent={<BranchesStatusBarContent {...statusBarProps} />}
      restoreMode={restoreMode}
      helpText={helpText}
      currentPath={currentPath}
    >
      <Box flexGrow={1} flexDirection="column">
        {branches.length === 0 || isRefreshing ? (
          <Spinner text="Loading branches..." />
        ) : (
          <>
            <BranchesList branches={branchesToDisplay} />
            {confirmationConfig && (
              <ConfirmationBar
                type={confirmationConfig.type}
                confirmText={confirmationConfig.confirmText}
                cancelText={confirmationConfig.cancelText}
                onConfirm={handleConfirmWrapper}
                onCancel={handleCancel}
              >
                {confirmationConfig.message && (
                  <Text>{confirmationConfig.message}</Text>
                )}
              </ConfirmationBar>
            )}
          </>
        )}
      </Box>
    </ViewLayout>
  )
})
