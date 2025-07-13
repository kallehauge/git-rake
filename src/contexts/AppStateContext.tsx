import { createContext, useContext, useReducer, ReactNode, useMemo, useCallback } from 'react';
import { GitBranch, FilterType } from '../types/index.js';
import { BranchSearcher, getFilterOptionsForType, filterBranches, sortBranches } from '../utils/filters.js';

type AppState = 'loading' | 'browsing' | 'confirming' | 'operating' | 'error';

interface StatusBarInfo {
  filterType: FilterType;
  totalBranches: number;
  filteredBranches: number;
  selectedCount: number;
  searchMode: boolean;
  searchInputActive: boolean;
  searchQuery: string;
}

interface AppStateContextType {
  // App state
  state: AppState;
  previewBranch: GitBranch | null;
  showDetailView: boolean;
  ctrlCCount: number;

  // Branch data
  branches: GitBranch[];
  filteredBranches: GitBranch[];

  // Selection state
  selectedBranches: GitBranch[];
  selectedBranchNames: Set<string>;
  selectedIndex: number;
  currentBranch: GitBranch | null;

  // Search state
  searchMode: boolean;
  searchInputActive: boolean;
  searchQuery: string;
  filterType: FilterType;

  // Status bar derived data
  statusBarInfo: StatusBarInfo;

  dispatch: React.Dispatch<AppStateAction>;
}

type AppStateAction =
  // App state actions
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'SET_PREVIEW_BRANCH'; payload: GitBranch | null }
  | { type: 'SET_SHOW_DETAIL_VIEW'; payload: boolean }
  | { type: 'SET_CTRL_C_COUNT'; payload: number }
  | { type: 'TOGGLE_DETAIL_VIEW' }
  | { type: 'RESET_CTRL_C_COUNT' }

  // Branch data actions
  | { type: 'SET_BRANCHES'; payload: GitBranch[] }

  // Selection actions
  | { type: 'SET_SELECTED_INDEX'; payload: number }
  | { type: 'TOGGLE_BRANCH_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SELECTED_BRANCHES'; payload: GitBranch[] }

  // Search actions
  | { type: 'SET_SEARCH_MODE'; payload: boolean }
  | { type: 'SET_SEARCH_INPUT_ACTIVE'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'APPEND_SEARCH_QUERY'; payload: string }
  | { type: 'BACKSPACE_SEARCH_QUERY' }
  | { type: 'SET_FILTER_TYPE'; payload: FilterType }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'CYCLE_FILTER' }

  // Navigation actions
  | { type: 'NAVIGATE_UP' }
  | { type: 'NAVIGATE_DOWN' };

const initialState = {
  // App state
  state: 'loading' as AppState,
  previewBranch: null as GitBranch | null,
  showDetailView: false,
  ctrlCCount: 0,

  // Branch data (will be injected by provider)
  branches: [] as GitBranch[],
  filteredBranches: [] as GitBranch[],

  // Selection state
  selectedBranches: [] as GitBranch[],
  selectedBranchNames: new Set<string>(),
  selectedIndex: 0,
  currentBranch: null as GitBranch | null,

  // Search state
  searchMode: false,
  searchInputActive: false,
  searchQuery: '',
  filterType: 'all' as FilterType,

  // Status bar derived data
  statusBarInfo: {
    filterType: 'all' as FilterType,
    totalBranches: 0,
    filteredBranches: 0,
    selectedCount: 0,
    searchMode: false,
    searchInputActive: false,
    searchQuery: '',
  },
};

// Helper function to handle navigation with current branches
function handleNavigationAction(
  state: typeof initialState,
  action: AppStateAction,
  direction: 'up' | 'down'
): typeof initialState {
  const currentBranches = (action as any).branches || state.branches;
  const stateWithCurrentBranches = { ...state, branches: currentBranches };
  const updatedState = updateDerivedState(stateWithCurrentBranches, true);

  const isUpNavigation = direction === 'up';
  const canNavigate = isUpNavigation
    ? updatedState.selectedIndex > 0
    : updatedState.selectedIndex < updatedState.filteredBranches.length - 1;

  if (canNavigate) {
    const newIndex = isUpNavigation
      ? updatedState.selectedIndex - 1
      : updatedState.selectedIndex + 1;
    const currentBranch = updatedState.filteredBranches[newIndex] || null;

    return {
      ...updatedState,
      selectedIndex: newIndex,
      currentBranch,
      previewBranch: currentBranch,
    };
  }

  return updatedState;
}

// Helper function to update derived state (filtered branches, selected branches, status bar)
function updateDerivedState(state: typeof initialState, preserveNavigation = false): typeof initialState {
  // Update filtered branches based on search and filter
  let filteredBranches = state.branches;

  if (state.searchQuery.trim()) {
    const searcher = new BranchSearcher(state.branches);
    filteredBranches = searcher.search(state.searchQuery);
  } else {
    const filterOptions = getFilterOptionsForType(state.filterType);
    filteredBranches = filterBranches(state.branches, filterOptions);
  }

  filteredBranches = sortBranches(filteredBranches);

  // Update selected branches based on selected names
  const selectedBranches = Array.from(state.selectedBranchNames)
    .map(name => state.branches.find(b => b.name === name))
    .filter(Boolean) as GitBranch[];

  // Only update navigation state if not preserving it
  let selectedIndex = state.selectedIndex;
  let currentBranch = state.currentBranch;
  let previewBranch = state.previewBranch;

  if (!preserveNavigation) {
    // Ensure selected index is valid when filtering/searching changes
    selectedIndex = Math.max(0, Math.min(state.selectedIndex, filteredBranches.length - 1));
    currentBranch = filteredBranches[selectedIndex] || null;
    previewBranch = currentBranch;
  }

  // Update status bar info
  const statusBarInfo: StatusBarInfo = {
    filterType: state.filterType,
    totalBranches: state.branches.length,
    filteredBranches: filteredBranches.length,
    selectedCount: selectedBranches.length,
    searchMode: state.searchMode,
    searchInputActive: state.searchInputActive,
    searchQuery: state.searchQuery,
  };

  return {
    ...state,
    filteredBranches,
    selectedBranches,
    selectedIndex,
    currentBranch,
    previewBranch,
    statusBarInfo,
  };
}

function appStateReducer(state: typeof initialState, action: AppStateAction): typeof initialState {
  switch (action.type) {
    // App state actions
    case 'SET_STATE':
      return { ...state, state: action.payload };
    case 'SET_PREVIEW_BRANCH':
      return { ...state, previewBranch: action.payload };
    case 'SET_SHOW_DETAIL_VIEW':
      return { ...state, showDetailView: action.payload };
    case 'SET_CTRL_C_COUNT':
      return { ...state, ctrlCCount: action.payload };
    case 'TOGGLE_DETAIL_VIEW':
      return { ...state, showDetailView: !state.showDetailView };
    case 'RESET_CTRL_C_COUNT':
      return { ...state, ctrlCCount: 0 };

    // Branch data actions
    case 'SET_BRANCHES': {
      const newState = { ...state, branches: action.payload };
      return updateDerivedState(newState);
    }

    // Selection actions
    case 'SET_SELECTED_INDEX': {
      const newIndex = Math.max(0, Math.min(action.payload, state.filteredBranches.length - 1));
      const currentBranch = state.filteredBranches[newIndex] || null;
      return {
        ...state,
        selectedIndex: newIndex,
        currentBranch,
        previewBranch: currentBranch,
      };
    }

    case 'TOGGLE_BRANCH_SELECTION': {
      const branchName = action.payload;
      const newSelectedNames = new Set(state.selectedBranchNames);

      if (newSelectedNames.has(branchName)) {
        newSelectedNames.delete(branchName);
      } else {
        newSelectedNames.add(branchName);
      }

      const newState = { ...state, selectedBranchNames: newSelectedNames };
      return updateDerivedState(newState);
    }

    case 'CLEAR_SELECTION': {
      const newState = {
        ...state,
        selectedBranchNames: new Set<string>(),
        selectedBranches: [],
      };
      return updateDerivedState(newState);
    }

    case 'SET_SELECTED_BRANCHES': {
      const branchNames = new Set(action.payload.map(b => b.name));
      const newState = {
        ...state,
        selectedBranches: action.payload,
        selectedBranchNames: branchNames,
      };
      return updateDerivedState(newState);
    }

    // Search actions
    case 'SET_SEARCH_MODE': {
      const newState = { ...state, searchMode: action.payload };
      if (!action.payload) {
        newState.searchInputActive = false;
        newState.searchQuery = '';
      }
      return updateDerivedState(newState);
    }

    case 'SET_SEARCH_INPUT_ACTIVE':
      return { ...state, searchInputActive: action.payload };

    case 'SET_SEARCH_QUERY': {
      const newState = { ...state, searchQuery: action.payload };
      return updateDerivedState(newState);
    }

    case 'APPEND_SEARCH_QUERY': {
      const newState = { ...state, searchQuery: state.searchQuery + action.payload };
      return updateDerivedState(newState);
    }

    case 'BACKSPACE_SEARCH_QUERY': {
      const newState = { ...state, searchQuery: state.searchQuery.slice(0, -1) };
      return updateDerivedState(newState);
    }

    case 'SET_FILTER_TYPE': {
      const newState = {
        ...state,
        filterType: action.payload,
        selectedIndex: 0,
      };
      return updateDerivedState(newState);
    }

    case 'CLEAR_SEARCH': {
      const newState = {
        ...state,
        searchMode: false,
        searchInputActive: false,
        searchQuery: '',
      };
      return updateDerivedState(newState);
    }

    case 'CYCLE_FILTER': {
      const filterTypes: FilterType[] = ['all', 'merged', 'stale', 'unmerged'];
      const currentIndex = filterTypes.indexOf(state.filterType);
      const nextIndex = (currentIndex + 1) % filterTypes.length;
      const newState = {
        ...state,
        filterType: filterTypes[nextIndex],
        selectedIndex: 0,
      };
      return updateDerivedState(newState);
    }

    // Navigation actions
    case 'NAVIGATE_UP':
      return handleNavigationAction(state, action, 'up');

    case 'NAVIGATE_DOWN':
      return handleNavigationAction(state, action, 'down');

    default:
      return state;
  }
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

interface AppStateProviderProps {
  children: ReactNode;
  branches: GitBranch[];
}

export function AppStateProvider({ children, branches }: AppStateProviderProps) {
  const [appState, originalDispatch] = useReducer(appStateReducer, initialState);

  // Enhanced dispatch that injects branches into navigation actions
  const dispatch = useCallback((action: AppStateAction) => {
    const isNavigationAction = action.type === 'NAVIGATE_UP' || action.type === 'NAVIGATE_DOWN';

    if (isNavigationAction) {
      originalDispatch({ ...action, branches } as any);
    } else {
      originalDispatch(action);
    }
  }, [originalDispatch, branches]);

  // Compute context value with current branches and derived state
  const contextValue: AppStateContextType = useMemo(() => {
    const stateWithBranches = { ...appState, branches };
    const derivedState = updateDerivedState(stateWithBranches, false);

    return {
      ...derivedState,
      dispatch,
    };
  }, [appState, branches, dispatch]);

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
