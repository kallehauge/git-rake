import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { GitBranch, FilterType } from '../types';
import { useTheme } from './ThemeProvider';
import { BranchItem } from './BranchItem';
import { BranchListHeader } from './BranchListHeader';
import { SearchInput } from './SearchInput';
import { BranchSearcher, getFilterOptionsForType, filterBranches, sortBranches } from '../utils/filters';

interface StatusBarInfo {
  filterType: FilterType;
  totalBranches: number;
  filteredBranches: number;
  selectedCount: number;
  searchMode: boolean;
  searchInputActive: boolean;
  searchQuery: string;
}

interface BranchListProps {
  branches: GitBranch[];
  onBranchesSelected: (branches: GitBranch[]) => void;
  onPreviewBranch: (branch: GitBranch | null) => void;
  onStatusBarChange: (info: StatusBarInfo) => void;
  loading?: boolean;
  restoreMode?: boolean;
  dryRun?: boolean;
}

export function BranchList({ branches, onBranchesSelected, onPreviewBranch, onStatusBarChange, loading = false, restoreMode = false, dryRun = false }: BranchListProps) {
  const { theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchMode, setSearchMode] = useState(false);
  const [searchInputActive, setSearchInputActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searcher = useMemo(() => new BranchSearcher(branches), [branches]);

  const filteredBranches = useMemo(() => {
    let result = branches;

    if (searchQuery.trim()) {
      result = searcher.search(searchQuery);
    } else {
      const filterOptions = getFilterOptionsForType(filterType);
      result = filterBranches(branches, filterOptions);
    }

    return sortBranches(result);
  }, [branches, filterType, searchQuery, searcher]);

  const currentBranch = filteredBranches[selectedIndex];

  useEffect(() => {
    searcher.updateBranches(branches);
  }, [branches, searcher]);

  useEffect(() => {
    onPreviewBranch(currentBranch || null);
  }, [currentBranch, onPreviewBranch]);

  useEffect(() => {
    const selected = Array.from(selectedBranches)
      .map(name => branches.find(b => b.name === name))
      .filter(Boolean) as GitBranch[];
    onBranchesSelected(selected);
  }, [selectedBranches, branches, onBranchesSelected]);

  useEffect(() => {
    if (selectedIndex >= filteredBranches.length && filteredBranches.length > 0) {
      setSelectedIndex(filteredBranches.length - 1);
    }
  }, [filteredBranches.length, selectedIndex]);

  useEffect(() => {
    onStatusBarChange({
      filterType,
      totalBranches: branches.length,
      filteredBranches: filteredBranches.length,
      selectedCount: selectedBranches.size,
      searchMode,
      searchInputActive,
      searchQuery,
    });
  }, [filterType, branches.length, filteredBranches.length, selectedBranches.size, searchMode, searchInputActive, searchQuery, onStatusBarChange]);

  useInput((input, key) => {
    // Allow Ctrl+C to pass through to App component for exit handling
    if (key.ctrl && input === 'c') {
      return;
    }

    if (searchMode) {
      if (key.escape) {
        setSearchMode(false);
        setSearchInputActive(false);
        setSearchQuery('');
        return;
      }

      // Re-activate search input if user presses / only when search input is not active
      if (input === '/' && !searchInputActive) {
        setSearchInputActive(true);
        return;
      }

      // Handle search input only when search input is active
      if (searchInputActive) {
        if (key.backspace) {
          setSearchQuery(searchQuery.slice(0, -1));
          return;
        }

        if (key.delete) {
          setSearchQuery('');
          return;
        }

        if (input && !key.ctrl && !key.meta && !key.upArrow && !key.downArrow && input !== ' ') {
          setSearchQuery(searchQuery + input);
          return;
        }
      }

      // Allow arrow keys in search mode - deactivate search input when navigating
      if (key.upArrow && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
        setSearchInputActive(false);
        return;
      }

      if (key.downArrow && selectedIndex < filteredBranches.length - 1) {
        setSelectedIndex(selectedIndex + 1);
        setSearchInputActive(false);
        return;
      }

      // Fall through to normal input handling when search input is not active
    }

    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }

    if (key.downArrow && selectedIndex < filteredBranches.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }

    if (input === ' ' && currentBranch && !currentBranch.isCurrent) {
      const newSelected = new Set(selectedBranches);
      if (newSelected.has(currentBranch.name)) {
        newSelected.delete(currentBranch.name);
      } else {
        newSelected.add(currentBranch.name);
      }
      setSelectedBranches(newSelected);
    }

    if (input === '/') {
      setSearchMode(true);
      setSearchInputActive(true);
    }

    if (input === 'f') {
      const filterTypes: FilterType[] = ['all', 'merged', 'stale', 'unmerged'];
      const currentIndex = filterTypes.indexOf(filterType);
      const nextIndex = (currentIndex + 1) % filterTypes.length;
      setFilterType(filterTypes[nextIndex]);
      setSelectedIndex(0);
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" height="100%">
        <Text color={theme.colors.text}>Loading branches...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <BranchListHeader />

      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {filteredBranches.length === 0 ? (
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Text color={theme.colors.secondary}>
              {searchQuery ? `No branches found for "${searchQuery}"` : 'No branches found'}
            </Text>
          </Box>
        ) : (
          filteredBranches.map((branch, index) => (
            <BranchItem
              key={branch.ref}
              branch={branch}
              isSelected={index === selectedIndex}
              isMarked={selectedBranches.has(branch.name)}
              showSelection={!branch.isCurrent}
            />
          ))
        )}
      </Box>
    </Box>
  );
}