import React from 'react';
import { Box, useInput } from 'ink';
import { useAppUIContext, useBranchDataContext } from '../../contexts/AppProviders.js';
import { useSearch } from '../../hooks/useSearch.js';
import { BranchList } from './BranchList.js';
import { ViewLayout } from '../../components/ViewLayout.js';
import { BranchStatusBarContent } from './BranchStatusBarContent.js';

interface BranchesViewProps {
  restoreMode: boolean;
  dryRun: boolean;
  currentPath: string;
}

export const BranchesView = React.memo(function BranchesView({
  restoreMode,
  dryRun,
  currentPath,
}: BranchesViewProps) {
  const { state, setCurrentView, inputLocked } = useAppUIContext();
  const { selectedBranches } = useBranchDataContext();
  const { handleSearchInput, activateSearch, cycleFilter } = useSearch();

  useInput((input, key) => {
    if (state !== 'ready') return;

    if (handleSearchInput(input, key)) return;
  });

  useInput((input, key) => {
    if (state !== 'ready') return;

    if (input === '/') {
      activateSearch();
      return;
    }

    if (input === 'f') {
      cycleFilter();
      return;
    }

    if (key.return) {
      setCurrentView('branch');
      return;
    }

    if ((input === 'd' || input === 'r') && selectedBranches.length > 0) {
      setCurrentView('confirmation');
      return;
    }
  }, { isActive: !inputLocked });

  const helpText = `↑↓: navigate • space: select • /: search • f: filter • enter: details • ${restoreMode ? 'r: restore' : 'd: delete'}`;

  return (
    <ViewLayout
      statusBarContent={<BranchStatusBarContent />}
      restoreMode={restoreMode}
      dryRun={dryRun}
      helpText={helpText}
      currentPath={currentPath}
    >
      <Box flexGrow={1} flexDirection="column">
        <BranchList loading={state === 'loading'} />
      </Box>
    </ViewLayout>
  );
});
