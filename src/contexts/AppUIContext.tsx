import { createContext, useContext, ReactNode, useState, useMemo } from 'react'
import { GitRakeConfig } from '@utils/config.js'
import { getTheme, AppTheme } from '@utils/themes/index.js'

export type ViewState = 'branches' | 'branch' | 'confirmation'

type AppUIContextType = {
  currentView: ViewState
  inputLocked: boolean
  showExitWarning: boolean
  config: GitRakeConfig
  theme: AppTheme
  setCurrentView: (view: ViewState) => void
  setInputLocked: (locked: boolean) => void
  setShowExitWarning: (show: boolean) => void
}

const AppUIContext = createContext<AppUIContextType | undefined>(undefined)

interface AppUIProviderProps {
  children: ReactNode
  config: GitRakeConfig
}

export function AppUIProvider({ children, config }: AppUIProviderProps) {
  const [currentView, setCurrentView] = useState<ViewState>('branches')
  const [inputLocked, setInputLocked] = useState<boolean>(false)
  const [showExitWarning, setShowExitWarning] = useState<boolean>(false)

  const theme = useMemo(() => getTheme(config.theme), [config.theme])

  const contextValue = useMemo(
    () => ({
      currentView,
      setCurrentView,
      inputLocked,
      setInputLocked,
      showExitWarning,
      setShowExitWarning,
      config,
      theme,
    }),
    [currentView, inputLocked, showExitWarning, config, theme],
  )

  return (
    <AppUIContext.Provider value={contextValue}>
      {children}
    </AppUIContext.Provider>
  )
}

export function useAppUIContext() {
  const context = useContext(AppUIContext)
  if (context === undefined) {
    throw new Error('useAppUIContext must be used within an AppUIProvider')
  }
  return context
}
