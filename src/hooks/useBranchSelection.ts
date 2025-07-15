import { useCallback } from 'react';
import { GitBranch } from '../types/index.js';
import { useSelectionContext, useBranchDataContext } from '../contexts/AppProviders.js';

interface UseBranchSelectionReturn {
  toggleBranchSelection: (branch: GitBranch) => void;
  clearSelection: () => void;
  setSelectedBranches: (branches: GitBranch[]) => void;
  navigateUp: () => void;
  navigateDown: () => void;
  handleListNavigation: (key: any) => boolean;
}

export function useBranchSelection(): UseBranchSelectionReturn {
  const {
    selectedBranchNames,
    selectedIndex,
    setSelectedIndex,
    setSelectedBranchNames
  } = useSelectionContext();
  const { filteredBranches } = useBranchDataContext();

  const toggleBranchSelection = useCallback((branch: GitBranch) => {
    if (branch.isCurrent) return;

    const newSet = new Set(selectedBranchNames);
    if (newSet.has(branch.name)) {
      newSet.delete(branch.name);
    } else {
      newSet.add(branch.name);
    }
    setSelectedBranchNames(newSet);
  }, [selectedBranchNames, setSelectedBranchNames]);

  const clearSelection = useCallback(() => {
    setSelectedBranchNames(new Set());
  }, [setSelectedBranchNames]);

  const setSelectedBranches = useCallback((branches: GitBranch[]) => {
    const branchNames = new Set(branches.map(b => b.name));
    setSelectedBranchNames(branchNames);
  }, [setSelectedBranchNames]);

  const navigateUp = useCallback(() => {
    const newIndex = Math.max(0, selectedIndex - 1);
    setSelectedIndex(newIndex);
  }, [selectedIndex, setSelectedIndex]);

  const navigateDown = useCallback(() => {
    const maxIndex = Math.max(0, filteredBranches.length - 1);
    const newIndex = Math.min(maxIndex, selectedIndex + 1);
    setSelectedIndex(newIndex);
  }, [selectedIndex, setSelectedIndex, filteredBranches.length]);

  const handleListNavigation = useCallback((key: any): boolean => {
    if (key.upArrow) {
      navigateUp();
      return true;
    }

    if (key.downArrow) {
      navigateDown();
      return true;
    }

    return false;
  }, [navigateUp, navigateDown]);

  return {
    toggleBranchSelection,
    clearSelection,
    setSelectedBranches,
    navigateUp,
    navigateDown,
    handleListNavigation,
  };
}
