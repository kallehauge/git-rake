import React from 'react';
import { Box } from 'ink';
import { useAppUIContext } from '../../contexts/AppProviders.js';
import { BranchList } from './BranchList.js';
import { ViewLayout } from '../../components/ViewLayout.js';
import { BranchStatusBarContent } from './BranchStatusBarContent.js';

interface BranchesViewProps {
  restoreMode: boolean;
  dryRun: boolean;
  currentPath: string;
  ctrlCCount: number;
}

export const BranchesView = React.memo(function BranchesView({
  restoreMode,
  dryRun,
  currentPath,
  ctrlCCount,
}: BranchesViewProps) {
  const { state } = useAppUIContext();

  const helpText = `↑↓: navigate • Space: select • /: search • f: filter • v: details • ${restoreMode ? 'r: restore' : 'd: delete'} • Ctrl+C: exit`;

  return (
    <ViewLayout
      statusBarContent={<BranchStatusBarContent />}
      restoreMode={restoreMode}
      dryRun={dryRun}
      helpText={helpText}
      ctrlCCount={ctrlCCount}
      currentPath={currentPath}
    >
      <Box flexGrow={1} flexDirection="column">
        <BranchList loading={state === 'loading'} />
      </Box>
    </ViewLayout>
  );
});
