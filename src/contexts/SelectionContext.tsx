import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { GitBranch } from '../types/index.js';

export interface SelectionState {
  selectedBranchNames: Set<string>;
  selectedIndex: number;
}

export interface SelectionActions {
  setSelectedIndex: (index: number) => void;
  toggleBranchSelection: (branchName: string) => void;
  clearSelection: () => void;
  setSelectedBranches: (branches: GitBranch[]) => void;
  navigateUp: (maxIndex?: number) => void;
  navigateDown: (maxIndex?: number) => void;
}

type SelectionContextType = SelectionState & SelectionActions;

const defaultSelectionState: SelectionContextType = {
  selectedBranchNames: new Set(),
  selectedIndex: 0,
  setSelectedIndex: () => {},
  toggleBranchSelection: () => {},
  clearSelection: () => {},
  setSelectedBranches: () => {},
  navigateUp: () => {},
  navigateDown: () => {},
};

export const SelectionContext = createContext<SelectionContextType>(defaultSelectionState);

interface SelectionProviderProps {
  children: ReactNode;
}

export function SelectionProvider({ children }: SelectionProviderProps) {
  const [selectedBranchNames, setSelectedBranchNames] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(0);

  const toggleBranchSelection = useCallback((branchName: string) => {
    setSelectedBranchNames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(branchName)) {
        newSet.delete(branchName);
      } else {
        newSet.add(branchName);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBranchNames(new Set());
  }, []);

  const setSelectedBranches = useCallback((branches: GitBranch[]) => {
    const branchNames = new Set(branches.map(b => b.name));
    setSelectedBranchNames(branchNames);
  }, []);

  const navigateUp = useCallback(() => {
    setSelectedIndex(current => Math.max(0, current - 1));
  }, []);

  const navigateDown = useCallback(() => {
    setSelectedIndex(current => Math.max(0, current + 1));
  }, []);

  const contextValue = useMemo(() => ({
    selectedBranchNames,
    selectedIndex,
    setSelectedIndex,
    toggleBranchSelection,
    clearSelection,
    setSelectedBranches,
    navigateUp,
    navigateDown,
  }), [
    selectedBranchNames,
    selectedIndex,
    toggleBranchSelection,
    clearSelection,
    setSelectedBranches,
    navigateUp,
    navigateDown,
  ]);

  return (
    <SelectionContext.Provider value={contextValue}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelectionContext() {
  return useContext(SelectionContext);
}
