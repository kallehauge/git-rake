import { useState, useCallback, useRef, useEffect } from 'react'
import { useInput, useApp } from 'ink'
import { GitRepository } from '@services/GitRepository.js'
import { useAppOperations } from '@hooks/useAppOperations.js'
import { useBranchSelection } from '@hooks/useBranchSelection.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { useBranchDataContext } from '@contexts/BranchDataContext.js'
import { BranchesView } from '@views/branches/BranchesView.js'
import { BranchView } from '@views/branch/BranchView.js'
import { ConfirmationView } from '@views/confirmation/ConfirmationView.js'
import { ErrorView } from '@views/error/ErrorView.js'

interface ViewManagerProps {
  restoreMode?: boolean
  gitRepo: GitRepository
  currentPath: string
  onRefreshBranches?: () => Promise<void>
}

export function ViewManager({
  restoreMode = false,
  gitRepo,
  currentPath,
  onRefreshBranches,
}: ViewManagerProps) {
  const {
    state,
    currentView,
    setCurrentView,
    showExitWarning,
    setShowExitWarning,
  } = useAppUIContext()
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { exit } = useApp()

  const { selectedBranches } = useBranchDataContext()
  const { clearSelection } = useBranchSelection()
  const [error, setError] = useState<string>('')

  const { handleConfirmOperation } = useAppOperations({
    gitRepo,
    restoreMode,
    onOperationComplete: async () => {
      if (onRefreshBranches) {
        await onRefreshBranches()
      }
      clearSelection()
      setCurrentView('branches')
    },
    onOperationError: setError,
  })

  const handleConfirmOperationCallback = useCallback(async () => {
    return handleConfirmOperation(selectedBranches)
  }, [handleConfirmOperation, selectedBranches])

  const handleCtrlC = useCallback(() => {
    if (showExitWarning) {
      exit()
    } else {
      setShowExitWarning(true)

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current)
      }

      exitTimeoutRef.current = setTimeout(() => {
        setShowExitWarning(false)
        exitTimeoutRef.current = null
      }, 1000)
    }
  }, [showExitWarning, exit])

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current)
      }
    }
  }, [])

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      handleCtrlC()
    }
  })

  const renderCurrentView = () => {
    if (state === 'error') {
      return <ErrorView error={error} currentPath={currentPath} />
    }

    switch (currentView) {
      case 'branch':
        return <BranchView gitRepo={gitRepo} currentPath={currentPath} />

      case 'confirmation':
        return (
          <ConfirmationView
            branches={selectedBranches}
            operation={restoreMode ? 'restore' : 'delete'}
            onConfirm={handleConfirmOperationCallback}
            onCancel={() => setCurrentView('branches')}
            currentPath={currentPath}
          />
        )

      case 'branches':
      default:
        return (
          <BranchesView restoreMode={restoreMode} currentPath={currentPath} />
        )
    }
  }

  return renderCurrentView()
}
