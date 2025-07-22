import React, { useState, useMemo } from 'react'
import { Box, Text, useInput } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'
import { useSearch } from '@hooks/useSearch.js'
import { useBranchSelection } from '@hooks/useBranchSelection.js'
import {
  useBranchOperations,
  UI_OPERATIONS,
  UIOperationType,
} from '@hooks/useBranchOperations.js'
import { GitRepository } from '@services/GitRepository.js'
import { BranchList } from './BranchList.js'
import { ViewLayout } from '@views/app/ViewLayout.js'
import { BranchStatusBarContent } from './BranchStatusBarContent.js'
import { Spinner } from '@components/Spinner.js'
import {
  ConfirmationBar,
  CONFIRMATION_SHORTCUTS,
} from '@components/ConfirmationBar.js'
import type { BranchFilter } from '@utils/filters.js'

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
  const { state, inputLocked, setCurrentView } = useAppUIContext()
  const { selectedBranches, branches, statusBarInfo, refreshBranches } =
    useBranchDataContext()
  const {
    handleSearchInput,
    activateSearch,
    cycleFilter,
    setSelectedFilter,
    restoreFilter,
  } = useSearch()
  const { selectAllVisibleBranches } = useBranchSelection()
  const { performOperation } = useBranchOperations(gitRepo)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingOperation, setPendingOperation] = useState<UIOperationType>(
    UI_OPERATIONS.TRASH,
  )
  const [previousFilter, setPreviousFilter] = useState<BranchFilter>('all')

  useInput((input, key) => {
    if (state !== 'ready') return

    if (handleSearchInput(input, key)) return
  })

  useInput(
    (input, key) => {
      if (state !== 'ready') return

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
        setPendingOperation(UI_OPERATIONS.TRASH)
        setPreviousFilter(statusBarInfo.filterType)
        setSelectedFilter()
        setShowConfirmation(true)
        return
      }

      if (input === 'd' && selectedBranches.length > 0 && !restoreMode) {
        setPendingOperation(UI_OPERATIONS.DELETE)
        setPreviousFilter(statusBarInfo.filterType)
        setSelectedFilter()
        setShowConfirmation(true)
        return
      }

      if (input === 'r' && selectedBranches.length > 0 && restoreMode) {
        setPendingOperation(UI_OPERATIONS.RESTORE)
        setPreviousFilter(statusBarInfo.filterType)
        setSelectedFilter()
        setShowConfirmation(true)
        return
      }
    },
    { isActive: !inputLocked },
  )

  const handleConfirm = async () => {
    try {
      await performOperation(pendingOperation, selectedBranches)
      await refreshBranches()
    } catch (error) {
      // Error handling is managed by the hook and app-level state
      console.error('Operation failed:', error)
    } finally {
      restoreFilter(previousFilter)
      setShowConfirmation(false)
    }
  }

  const handleCancel = () => {
    restoreFilter(previousFilter)
    setShowConfirmation(false)
  }

  const createConfirmationConfig = (operation: UIOperationType) => {
    const configs = {
      [UI_OPERATIONS.DELETE]: {
        type: 'alert' as const,
        confirmText: 'Delete (Y)',
        cancelText: 'Cancel (N)',
        message:
          '⚠️ WARNING: This will permanently delete branches. This action cannot be undone!',
      },
      [UI_OPERATIONS.TRASH]: {
        type: 'warning' as const,
        confirmText: 'Trash (Y)',
        cancelText: 'Cancel (N)',
        message:
          'Note: Branches will be moved to trash and can be restored later.',
      },
      [UI_OPERATIONS.RESTORE]: {
        type: 'info' as const,
        confirmText: 'Restore (Y)',
        cancelText: 'Cancel (N)',
        message: undefined,
      },
    }
    return configs[operation]
  }

  const confirmationConfig = useMemo(() => {
    return showConfirmation ? createConfirmationConfig(pendingOperation) : null
  }, [showConfirmation, pendingOperation])

  const branchesHelpText = `↑↓: navigate • space: select • a: select all • /: search • f: filter • enter: details • ${restoreMode ? 'r: restore' : 't: trash • d: delete permanently'}`
  const confirmationHelpText = `${CONFIRMATION_SHORTCUTS.navigate}: navigate • ${CONFIRMATION_SHORTCUTS.confirm}: confirm • ${CONFIRMATION_SHORTCUTS.cancel}: cancel`
  const helpText = showConfirmation ? confirmationHelpText : branchesHelpText

  return (
    <ViewLayout
      statusBarContent={<BranchStatusBarContent />}
      restoreMode={restoreMode}
      helpText={helpText}
      currentPath={currentPath}
    >
      <Box flexGrow={1} flexDirection="column">
        {branches.length === 0 ? (
          <Spinner text="Loading branches..." />
        ) : (
          <>
            <BranchList />
            {confirmationConfig && (
              <ConfirmationBar
                type={confirmationConfig.type}
                confirmText={confirmationConfig.confirmText}
                cancelText={confirmationConfig.cancelText}
                onConfirm={handleConfirm}
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
