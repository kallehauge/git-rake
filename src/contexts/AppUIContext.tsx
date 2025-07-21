import { createContext, useContext, ReactNode, useState, useMemo } from 'react'
import { loadConfig, GitRakeConfig } from '@utils/config.js'
import { getTheme, AppTheme } from '@utils/themes/index.js'

export type AppState = 'ready' | 'error'
export type ViewState = 'branches' | 'branch' | 'confirmation'

export interface AppUIState {
  state: AppState
  currentView: ViewState
  inputLocked: boolean
  showExitWarning: boolean
  config: GitRakeConfig
  theme: AppTheme
}

export interface AppUIActions {
  setState: (state: AppState) => void
  setCurrentView: (view: ViewState) => void
  setInputLocked: (locked: boolean) => void
  setShowExitWarning: (show: boolean) => void
}

type AppUIContextType = AppUIState & AppUIActions

const defaultConfig = loadConfig()
const defaultTheme = getTheme(defaultConfig.theme)

const defaultAppUIState: AppUIContextType = {
  state: 'ready',
  currentView: 'branches',
  inputLocked: false,
  showExitWarning: false,
  config: defaultConfig,
  theme: defaultTheme,
  setState: () => {},
  setCurrentView: () => {},
  setInputLocked: () => {},
  setShowExitWarning: () => {},
}

const AppUIContext = createContext<AppUIContextType>(defaultAppUIState)

interface AppUIProviderProps {
  children: ReactNode
}

export function AppUIProvider({ children }: AppUIProviderProps) {
  const [state, setState] = useState<AppState>('ready')
  const [currentView, setCurrentView] = useState<ViewState>('branches')
  const [inputLocked, setInputLocked] = useState<boolean>(false)
  const [showExitWarning, setShowExitWarning] = useState<boolean>(false)

  const config = useMemo(loadConfig, [])
  const theme = useMemo(() => getTheme(config.theme), [config.theme])

  const contextValue = useMemo(
    () => ({
      state,
      setState,
      currentView,
      setCurrentView,
      inputLocked,
      setInputLocked,
      showExitWarning,
      setShowExitWarning,
      config,
      theme,
    }),
    [state, currentView, inputLocked, showExitWarning, config, theme],
  )

  return (
    <AppUIContext.Provider value={contextValue}>
      {children}
    </AppUIContext.Provider>
  )
}

export function useAppUIContext() {
  return useContext(AppUIContext)
}
