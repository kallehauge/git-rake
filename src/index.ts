import React from 'react'
import { Command } from 'commander'
import { withFullScreen } from 'fullscreen-ink'
import { App } from '@views/app/App.js'

const program = new Command()

program
  .name('git-rake')
  .description(
    'Interactive CLI tool to safely prune, delete, and restore Git branches',
  )
  .version('1.0.0')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action(async options => {
    const ink = withFullScreen(
      React.createElement(App, { workingDir: options.cwd }),
      { exitOnCtrlC: false },
    )
    await ink.start()
    await ink.waitUntilExit()

    // DEVELOPMENT MODE CLEANUP:
    // When DEV=true, Ink automatically imports react-devtools-core and calls connectToDevTools()
    // This creates a WebSocket server connection for DevTools communication.
    // The WebSocket connection has active listeners that keep the Node.js event loop alive when
    // we unmount the process. There's a realistic chance that our unmount logic has something to
    // do with this issue, so we should look into it in the future. For now, we exit with
    // process.exit(0) to terminate the WebSocket and close the process.
    if (process.env.DEV) {
      process.exit(0)
    }
  })

program
  .command('clean')
  .description('Clean up local branches interactively')
  .option('-r, --include-remote', 'Include remote tracking branches')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action(async options => {
    const ink = withFullScreen(
      React.createElement(App, {
        includeRemote: options.includeRemote,
        workingDir: options.cwd,
      }),
      { exitOnCtrlC: true },
    )
    await ink.start()
    await ink.waitUntilExit()

    // DEVELOPMENT MODE CLEANUP:
    // When DEV=true, Ink automatically imports react-devtools-core and calls connectToDevTools()
    // This creates a WebSocket server connection for DevTools communication.
    // The WebSocket connection has active listeners that keep the Node.js event loop alive when
    // we unmount the process. There's a realistic chance that our unmount logic has something to
    // do with this issue, so we should look into it in the future. For now, we exit with
    // process.exit(0) to terminate the WebSocket and close the process.
    // @todo id:dev-mode-cleanup
    if (process.env.DEV) {
      process.exit(0)
    }
  })

program
  .command('restore')
  .description('Restore deleted branches from trash')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action(async options => {
    const ink = withFullScreen(
      React.createElement(App, {
        restoreMode: true,
        workingDir: options.cwd,
      }),
      { exitOnCtrlC: false },
    )
    await ink.start()
    await ink.waitUntilExit()

    // DEVELOPMENT MODE CLEANUP:
    // When DEV=true, Ink automatically imports react-devtools-core and calls connectToDevTools()
    // This creates a WebSocket server connection for DevTools communication.
    // The WebSocket connection has active listeners that keep the Node.js event loop alive when
    // we unmount the process. There's a realistic chance that our unmount logic has something to
    // do with this issue, so we should look into it in the future. For now, we exit with
    // process.exit(0) to terminate the WebSocket and close the process.
    // @todo id:dev-mode-cleanup
    if (process.env.DEV) {
      process.exit(0)
    }
  })

program
  .command('restore')
  .argument('<branch-name>', 'Name of the branch to restore')
  .description('Restore a specific branch from trash')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action(async (branchName, options) => {
    const { GitRepository } = await import('@services/GitRepository.js')
    const gitRepo = new GitRepository(options.cwd)

    try {
      await gitRepo.restoreBranchFromTrash(branchName)
      console.log(`✅ Restored branch: ${branchName}`)
    } catch (error) {
      console.error(
        `❌ Failed to restore branch ${branchName}:`,
        error instanceof Error ? error.message : error,
      )
      process.exit(1)
    }
  })

program
  .command('trash')
  .description('List branches in trash')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action(async options => {
    const { GitRepository } = await import('@services/GitRepository.js')
    const gitRepo = new GitRepository(options.cwd)

    try {
      const trashBranches = await gitRepo.getTrashBranches()

      if (trashBranches.length === 0) {
        console.log('No branches in trash')
        return
      }

      console.log('Branches in trash:')
      trashBranches.forEach((branch: string) => {
        console.log(`  • ${branch}`)
      })
    } catch (error) {
      console.error(
        'Failed to list trash:',
        error instanceof Error ? error.message : error,
      )
      process.exit(1)
    }
  })

program
  .command('cleanup')
  .description('Clean up old entries from trash')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .action(async options => {
    const { GitRepository } = await import('@services/GitRepository.js')
    const gitRepo = new GitRepository(options.cwd)

    try {
      await gitRepo.cleanupTrash()
      console.log('✅ Cleaned up old trash entries')
    } catch (error) {
      console.error(
        'Failed to cleanup trash:',
        error instanceof Error ? error.message : error,
      )
      process.exit(1)
    }
  })

program
  .command('config')
  .description('Generate example configuration file')
  .action(async () => {
    const { createExampleConfig } = await import('@utils/config.js')
    console.log(createExampleConfig())
  })

program.parse()

export { App }
