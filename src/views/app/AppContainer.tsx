import { useState, useCallback, useRef, useEffect } from 'react'
import { useInput, Box } from 'ink'
import { useGitRepository } from '@hooks/useGitRepository.js'
import { useAppOperations } from '@hooks/useAppOperations.js'
import { useBranchSelection } from '@hooks/useBranchSelection.js'
import {
  useAppUIContext,
  useBranchDataContext,
} from '@contexts/AppProviders.js'
import { BranchesView } from '@views/branches/BranchesView.js'
import { BranchView } from '@views/branch/BranchView.js'
import { ConfirmationView } from '@views/confirmation/ConfirmationView.js'
import { ErrorView } from '@views/error/ErrorView.js'
import { ExitWarning } from './ExitWarning.js'

interface AppContainerProps {
  includeRemote?: boolean
  restoreMode?: boolean
  workingDir?: string
  onRefreshBranches?: () => Promise<void>
}

export function AppContainer({
  restoreMode = false,
  workingDir,
  onRefreshBranches,
}: AppContainerProps) {
  const { state, currentView, setCurrentView } = useAppUIContext()
  const [showExitWarning, setShowExitWarning] = useState(false)
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { selectedBranches } = useBranchDataContext()
  const { clearSelection } = useBranchSelection()
  const [error, setError] = useState<string>('')

  const { gitRepo, currentPath } = useGitRepository({ workingDir })

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
      // We use process.exit(0) instead of Ink's exit() because:
      // 1. Git operations via simple-git cannot be cancelled mid-execution
      // 2. When branches are loading, Ink's own exit() will wait for operations
      //    to complete, which can cause the app to appear "stuck"
      // 3. process.exit(0) forcefully terminates the Node.js process immediately
      //    without waiting for any operations to complete
      process.exit(0)
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
  }, [showExitWarning])

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

  return (
    <Box flexDirection="column">
      {renderCurrentView()}
      {showExitWarning && <ExitWarning />}
    </Box>
  )
}
