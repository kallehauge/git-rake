import type { BranchFilter } from '@utils/filters.js'

export type SearchState = {
  searchMode: boolean
  searchQuery: string
  filterType: BranchFilter
}

export type SearchActions = {
  setSearchMode: (active: boolean) => void
  setSearchQuery: (query: string) => void
  appendSearchQuery: (char: string) => void
  setFilterType: (type: BranchFilter) => void
}

export type SearchContextData = SearchState & SearchActions
