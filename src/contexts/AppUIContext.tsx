import { createContext, useContext, ReactNode, useState, useMemo } from 'react';

export type AppState = 'loading' | 'ready' | 'operating' | 'error';

export interface AppUIState {
  state: AppState;
}

export interface AppUIActions {
  setState: (state: AppState) => void;
}

type AppUIContextType = AppUIState & AppUIActions;

const defaultAppUIState: AppUIContextType = {
  state: 'loading',
  setState: () => {},
};

const AppUIContext = createContext<AppUIContextType>(defaultAppUIState);

interface AppUIProviderProps {
  children: ReactNode;
}

export function AppUIProvider({ children }: AppUIProviderProps) {
  const [state, setState] = useState<AppState>('loading');

  const contextValue = useMemo(() => ({
    state,
    setState,
  }), [
    state,
  ]);

  return (
    <AppUIContext.Provider value={contextValue}>
      {children}
    </AppUIContext.Provider>
  );
}

export function useAppUIContext() {
  return useContext(AppUIContext);
}
