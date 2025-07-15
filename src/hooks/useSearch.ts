import { useCallback } from 'react';
import { useSearchContext, useAppUIContext } from '../contexts/AppProviders.js';
import { FilterType } from '../types/index.js';

interface UseSearchReturn {
  handleSearchInput: (input: string, key: any) => boolean;
  activateSearch: () => void;
  clearSearch: () => void;
  cycleFilter: () => void;
}

export function useSearch(): UseSearchReturn {
  const {
    searchMode,
    filterType,
    setSearchQuery,
    appendSearchQuery,
    setSearchMode,
    setFilterType
  } = useSearchContext();
  const { setInputLocked } = useAppUIContext();

  const handleSearchInput = useCallback((input: string, key: any): boolean => {
    if (!searchMode) return false;

    if (key.escape) {
      setSearchMode(false);
      setSearchQuery('');
      setInputLocked(false);
      return true;
    }

    if (key.return) {
      setSearchMode(false);
      setInputLocked(false);
      return true;
    }

    if (key.delete || key.backspace) {
      setSearchQuery('');
      return true;
    }

    if (input && !key.ctrl && !key.meta && !key.shift) {
      appendSearchQuery(input);
      return true;
    }

    // Consume any other keys to prevent them from affecting other handlers
    return true;
  }, [searchMode, setSearchQuery, appendSearchQuery, setInputLocked, setSearchMode]);


  const activateSearch = useCallback(() => {
    setSearchMode(true);
    setInputLocked(true);
  }, [setSearchMode, setInputLocked]);

  const clearSearch = useCallback(() => {
    setSearchMode(false);
    setSearchQuery('');
  }, [setSearchMode, setSearchQuery]);

  const cycleFilter = useCallback(() => {
    const filterTypes: FilterType[] = ['all', 'merged', 'stale', 'unmerged'];
    const currentIndex = filterTypes.indexOf(filterType);
    const nextIndex = (currentIndex + 1) % filterTypes.length;
    setFilterType(filterTypes[nextIndex]);
  }, [filterType, setFilterType]);

  return {
    handleSearchInput,
    activateSearch,
    clearSearch,
    cycleFilter,
  };
}
