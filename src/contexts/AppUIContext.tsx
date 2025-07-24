import { createContext, useContext, ReactNode, useState, useMemo } from 'react'
import { getTheme } from '@utils/themes/index.js'
import type { ViewState, AppUIContextData } from './AppUIContext.types.js'
import type { GitRakeConfig } from '@utils/config.js'

const AppUIContext = createContext<AppUIContextData | undefined>(undefined)

type AppUIProviderProps = {
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
