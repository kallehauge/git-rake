import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { GitBranch } from '../types/index.js';

export type AppState = 'loading' | 'browsing' | 'confirming' | 'operating' | 'error';

export interface AppUIState {
  state: AppState;
  previewBranch: GitBranch | null;
  showDetailView: boolean;
  ctrlCCount: number;
}

export interface AppUIActions {
  setState: (state: AppState) => void;
  setPreviewBranch: (branch: GitBranch | null) => void;
  setShowDetailView: (show: boolean) => void;
  toggleDetailView: () => void;
  setCtrlCCount: (count: number) => void;
  resetCtrlCCount: () => void;
}

type AppUIContextType = AppUIState & AppUIActions;

const defaultAppUIState: AppUIContextType = {
  state: 'loading',
  previewBranch: null,
  showDetailView: false,
  ctrlCCount: 0,
  setState: () => {},
  setPreviewBranch: () => {},
  setShowDetailView: () => {},
  toggleDetailView: () => {},
  setCtrlCCount: () => {},
  resetCtrlCCount: () => {},
};

const AppUIContext = createContext<AppUIContextType>(defaultAppUIState);

interface AppUIProviderProps {
  children: ReactNode;
}

export function AppUIProvider({ children }: AppUIProviderProps) {
  const [state, setState] = useState<AppState>('loading');
  const [previewBranch, setPreviewBranch] = useState<GitBranch | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [ctrlCCount, setCtrlCCount] = useState(0);

  const toggleDetailView = useCallback(() => {
    setShowDetailView(prev => !prev);
  }, []);

  const resetCtrlCCount = useCallback(() => {
    setCtrlCCount(0);
  }, []);

  const contextValue = useMemo(() => ({
    state,
    previewBranch,
    showDetailView,
    ctrlCCount,
    setState,
    setPreviewBranch,
    setShowDetailView,
    toggleDetailView,
    setCtrlCCount,
    resetCtrlCCount,
  }), [
    state,
    previewBranch,
    showDetailView,
    ctrlCCount,
    toggleDetailView,
    resetCtrlCCount,
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
