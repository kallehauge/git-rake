import { createContext, useContext, ReactNode, useState, useMemo } from 'react'
import type { SelectionContextData } from './SelectionContext.types.js'

const defaultSelectionState: SelectionContextData = {
  selectedBranchNames: new Set(),
  selectedIndex: 0,
  setSelectedIndex: () => {},
  setSelectedBranchNames: () => {},
}

export const SelectionContext = createContext<SelectionContextData>(
  defaultSelectionState,
)

type SelectionProviderProps = {
  children: ReactNode
}

export function SelectionProvider({ children }: SelectionProviderProps) {
  const [selectedBranchNames, setSelectedBranchNames] = useState<Set<string>>(
    new Set(),
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const contextValue = useMemo(
    () => ({
      selectedBranchNames,
      selectedIndex,
      setSelectedIndex,
      setSelectedBranchNames,
    }),
    [selectedBranchNames, selectedIndex],
  )

  return (
    <SelectionContext.Provider value={contextValue}>
      {children}
    </SelectionContext.Provider>
  )
}

export function useSelectionContext() {
  return useContext(SelectionContext)
}
