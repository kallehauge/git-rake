import { useCallback, useRef, useEffect } from 'react'
import { useInput, useApp } from 'ink'
import { GitRepository } from '@services/GitRepository.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { BranchesView } from '@views/branches/BranchesView.js'
import { BranchView } from '@views/branch/BranchView.js'

type ViewManagerProps = {
  restoreMode?: boolean
  gitRepo: GitRepository
  currentPath: string
}

export function ViewManager({
  restoreMode = false,
  gitRepo,
  currentPath,
}: ViewManagerProps) {
  const { currentView, showExitWarning, setShowExitWarning } = useAppUIContext()
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { exit } = useApp()

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
  }, [showExitWarning, exit, setShowExitWarning, exitTimeoutRef])

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
    switch (currentView) {
      case 'branch':
        return <BranchView gitRepo={gitRepo} currentPath={currentPath} />

      case 'branches':
      default:
        return (
          <BranchesView
            restoreMode={restoreMode}
            currentPath={currentPath}
            gitRepo={gitRepo}
          />
        )
    }
  }

  return renderCurrentView()
}
