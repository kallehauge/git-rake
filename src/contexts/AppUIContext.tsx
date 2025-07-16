import { createContext, useContext, ReactNode, useState, useMemo } from 'react'

export type AppState = 'ready' | 'error'
export type ViewState = 'branches' | 'branch' | 'confirmation'

export interface AppUIState {
  state: AppState
  currentView: ViewState
  inputLocked: boolean
}

export interface AppUIActions {
  setState: (state: AppState) => void
  setCurrentView: (view: ViewState) => void
  setInputLocked: (locked: boolean) => void
}

type AppUIContextType = AppUIState & AppUIActions

const defaultAppUIState: AppUIContextType = {
  state: 'ready',
  currentView: 'branches',
  inputLocked: false,
  setState: () => {},
  setCurrentView: () => {},
  setInputLocked: () => {},
}

const AppUIContext = createContext<AppUIContextType>(defaultAppUIState)

interface AppUIProviderProps {
  children: ReactNode
}

export function AppUIProvider({ children }: AppUIProviderProps) {
  const [state, setState] = useState<AppState>('ready')
  const [currentView, setCurrentView] = useState<ViewState>('branches')
  const [inputLocked, setInputLocked] = useState<boolean>(false)

  const contextValue = useMemo(
    () => ({
      state,
      setState,
      currentView,
      setCurrentView,
      inputLocked,
      setInputLocked,
    }),
    [state, currentView, inputLocked],
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
