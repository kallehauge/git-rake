import { useCallback } from 'react';
import { GitBranch } from '../types/index.js';
import { useSelectionContext } from '../contexts/AppProviders.js';

interface UseBranchSelectionReturn {
  toggleBranchSelection: (branch: GitBranch) => void;
  clearSelection: () => void;
  navigateUp: () => void;
  navigateDown: () => void;
  handleNavigation: (key: any) => boolean;
}

export function useBranchSelection(): UseBranchSelectionReturn {
  const { 
    toggleBranchSelection: toggleBranchSelectionAction,
    clearSelection: clearSelectionAction,
    navigateUp: navigateUpAction,
    navigateDown: navigateDownAction
  } = useSelectionContext();

  const toggleBranchSelection = useCallback((branch: GitBranch) => {
    if (branch.isCurrent) return;
    toggleBranchSelectionAction(branch.name);
  }, [toggleBranchSelectionAction]);

  const clearSelection = useCallback(() => {
    clearSelectionAction();
  }, [clearSelectionAction]);

  const navigateUp = useCallback(() => {
    navigateUpAction();
  }, [navigateUpAction]);

  const navigateDown = useCallback(() => {
    navigateDownAction();
  }, [navigateDownAction]);

  const handleNavigation = useCallback((key: any): boolean => {
    if (key.upArrow) {
      navigateUpAction();
      return true;
    }

    if (key.downArrow) {
      navigateDownAction();
      return true;
    }

    return false;
  }, [navigateUpAction, navigateDownAction]);

  return {
    toggleBranchSelection,
    clearSelection,
    navigateUp,
    navigateDown,
    handleNavigation,
  };
}
