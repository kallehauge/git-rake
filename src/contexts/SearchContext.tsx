import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useMemo,
} from 'react'
import type { BranchFilter } from '@utils/filters.types.js'

type SearchState = {
  searchMode: boolean
  searchQuery: string
  filterType: BranchFilter
}

type SearchActions = {
  setSearchMode: (active: boolean) => void
  setSearchQuery: (query: string) => void
  appendSearchQuery: (char: string) => void
  setFilterType: (type: BranchFilter) => void
}

type SearchContextData = SearchState & SearchActions

const defaultSearchState: SearchContextData = {
  searchMode: false,
  searchQuery: '',
  filterType: 'all',
  setSearchMode: () => {},
  setSearchQuery: () => {},
  appendSearchQuery: () => {},
  setFilterType: () => {},
}

export const SearchContext =
  createContext<SearchContextData>(defaultSearchState)

type SearchProviderProps = {
  children: ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [searchMode, setSearchModeState] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<BranchFilter>('all')

  const setSearchMode = useCallback((active: boolean) => {
    setSearchModeState(active)
  }, [])

  const appendSearchQuery = useCallback((char: string) => {
    setSearchQuery(prev => prev + char)
  }, [])

  const contextValue = useMemo(
    () => ({
      searchMode,
      searchQuery,
      filterType,
      setSearchMode,
      setSearchQuery,
      appendSearchQuery,
      setFilterType,
    }),
    [searchMode, searchQuery, filterType, setSearchMode, appendSearchQuery],
  )

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchContext() {
  return useContext(SearchContext)
}
