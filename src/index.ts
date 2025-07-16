import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './views/app/App.js';

const program = new Command();

program
  .name('git-rake')
  .description('Interactive CLI tool to safely prune, delete, and restore Git branches')
  .version('1.0.0')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action((options) => {
    render(React.createElement(App, { workingDir: options.cwd }), { exitOnCtrlC: false });
  });

program
  .command('clean')
  .description('Clean up local branches interactively')
  .option('-r, --include-remote', 'Include remote tracking branches')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action((options) => {
    render(React.createElement(App, {
      includeRemote: options.includeRemote,
      workingDir: options.cwd,
    }));
  });

program
  .command('restore')
  .description('Restore deleted branches from trash')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action((options) => {
    render(React.createElement(App, {
      restoreMode: true,
      workingDir: options.cwd,
    }));
  });

program
  .command('restore')
  .argument('<branch-name>', 'Name of the branch to restore')
  .description('Restore a specific branch from trash')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action(async (branchName, options) => {
    const { GitRepository } = await import('./services/GitRepository.js');
    const gitRepo = new GitRepository(options.cwd);

    try {
      await gitRepo.restoreBranchFromTrash(branchName);
      console.log(`✅ Restored branch: ${branchName}`);
    } catch (error) {
      console.error(`❌ Failed to restore branch ${branchName}:`, error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('trash')
  .description('List branches in trash')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action(async (options) => {
    const { GitRepository } = await import('./services/GitRepository.js');
    const gitRepo = new GitRepository(options.cwd);

    try {
      const trashBranches = await gitRepo.getTrashBranches();

      if (trashBranches.length === 0) {
        console.log('No branches in trash');
        return;
      }

      console.log('Branches in trash:');
      trashBranches.forEach((branch: string) => {
        console.log(`  • ${branch}`);
      });
    } catch (error) {
      console.error('Failed to list trash:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('cleanup')
  .description('Clean up old entries from trash')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action(async (options) => {
    const { GitRepository } = await import('./services/GitRepository.js');
    const gitRepo = new GitRepository(options.cwd);

    try {
      await gitRepo.cleanupTrash();
      console.log('✅ Cleaned up old trash entries');
    } catch (error) {
      console.error('Failed to cleanup trash:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Generate example configuration file')
  .action(async () => {
    const { createExampleConfig } = await import('./utils/config.js');
    console.log(createExampleConfig());
  });

program.parse();

export { App };
