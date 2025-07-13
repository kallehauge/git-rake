import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { FilterType } from '../types/index.js';

export interface SearchState {
  searchMode: boolean;
  searchInputActive: boolean;
  searchQuery: string;
  filterType: FilterType;
}

export interface SearchActions {
  setSearchMode: (active: boolean) => void;
  setSearchInputActive: (active: boolean) => void;
  setSearchQuery: (query: string) => void;
  appendSearchQuery: (char: string) => void;
  backspaceSearchQuery: () => void;
  setFilterType: (type: FilterType) => void;
  clearSearch: () => void;
  cycleFilter: () => void;
}

type SearchContextType = SearchState & SearchActions;

const defaultSearchState: SearchContextType = {
  searchMode: false,
  searchInputActive: false,
  searchQuery: '',
  filterType: 'all',
  setSearchMode: () => {},
  setSearchInputActive: () => {},
  setSearchQuery: () => {},
  appendSearchQuery: () => {},
  backspaceSearchQuery: () => {},
  setFilterType: () => {},
  clearSearch: () => {},
  cycleFilter: () => {},
};

export const SearchContext = createContext<SearchContextType>(defaultSearchState);

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [searchMode, setSearchModeState] = useState(false);
  const [searchInputActive, setSearchInputActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const setSearchMode = useCallback((active: boolean) => {
    setSearchModeState(active);
    if (!active) {
      setSearchInputActive(false);
      setSearchQuery('');
    }
  }, []);

  const appendSearchQuery = useCallback((char: string) => {
    setSearchQuery(prev => prev + char);
  }, []);

  const backspaceSearchQuery = useCallback(() => {
    setSearchQuery(prev => prev.slice(0, -1));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchModeState(false);
    setSearchInputActive(false);
    setSearchQuery('');
  }, []);

  const cycleFilter = useCallback(() => {
    setFilterType(current => {
      const filterTypes: FilterType[] = ['all', 'merged', 'stale', 'unmerged'];
      const currentIndex = filterTypes.indexOf(current);
      const nextIndex = (currentIndex + 1) % filterTypes.length;
      return filterTypes[nextIndex];
    });
  }, []);

  const contextValue = useMemo(() => ({
    searchMode,
    searchInputActive,
    searchQuery,
    filterType,
    setSearchMode,
    setSearchInputActive,
    setSearchQuery,
    appendSearchQuery,
    backspaceSearchQuery,
    setFilterType,
    clearSearch,
    cycleFilter,
  }), [
    searchMode,
    searchInputActive,
    searchQuery,
    filterType,
    setSearchMode,
    appendSearchQuery,
    backspaceSearchQuery,
    clearSearch,
    cycleFilter,
  ]);

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  return useContext(SearchContext);
}
