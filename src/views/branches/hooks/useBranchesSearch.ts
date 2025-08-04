import { useCallback } from 'react'
import { Key } from 'ink'
import { useSearchContext } from '@contexts/SearchContext.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import type { BranchFilter } from '@utils/filters.types.js'

type UseBranchesSearchReturn = {
  handleSearchInput: (input: string, key: Key) => boolean
  activateSearch: () => void
  clearSearch: () => void
  cycleFilter: () => void
}

export function useBranchesSearch(): UseBranchesSearchReturn {
  const {
    searchMode,
    filterType,
    setSearchQuery,
    appendSearchQuery,
    setSearchMode,
    setFilterType,
  } = useSearchContext()
  const { setInputLocked } = useAppUIContext()

  const handleSearchInput = useCallback(
    (input: string, key: Key): boolean => {
      // Clear search query on escape no matter which screen the user is on
      // One case this is useful is when the user is focusing the Branches
      // screen and they want to clear search query filtering
      if (key.escape) {
        setSearchQuery('')
      }

      // (I) Bail early for any other operations if we're not in active search input mode
      if (!searchMode) {
        return false
      }

      if (key.escape) {
        setSearchMode(false)
        setInputLocked(false)
        return true
      }

      if (key.return) {
        setSearchMode(false)
        setInputLocked(false)
        return true
      }

      if (key.delete || key.backspace) {
        setSearchQuery(prev => {
          if (prev.length <= 0) {
            return ''
          }

          return prev.slice(0, -1)
        })
        return true
      }

      if (input && !key.ctrl && !key.meta && !key.shift) {
        appendSearchQuery(input)
        return true
      }

      // Consume any other keys to prevent them from affecting other handlers
      return true
    },
    [
      searchMode,
      setSearchQuery,
      appendSearchQuery,
      setInputLocked,
      setSearchMode,
    ],
  )

  const activateSearch = useCallback(() => {
    setSearchMode(true)
    setInputLocked(true)
  }, [setSearchMode, setInputLocked])

  const clearSearch = useCallback(() => {
    setSearchMode(false)
    setSearchQuery('')
  }, [setSearchMode, setSearchQuery])

  const cycleFilter = useCallback(() => {
    const filterTypes: BranchFilter[] = [
      'all',
      'merged',
      'stale',
      'unmerged',
      'selected',
    ]
    const currentIndex = filterTypes.indexOf(filterType)
    const nextIndex = (currentIndex + 1) % filterTypes.length
    setFilterType(filterTypes[nextIndex])
  }, [filterType, setFilterType])

  return {
    handleSearchInput,
    activateSearch,
    clearSearch,
    cycleFilter,
  }
}
