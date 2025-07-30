import { Command } from 'commander'
import { App } from '@views/app/App.js'
import { restoreCommand, trashCommand } from '@commands/index.js'

const program = new Command()

program
  .name('git-rake')
  .description(
    'Interactive CLI tool to safely delete, trash, and restore Git branches',
  )
  .version('0.1.0')
  .option('--cwd <path>', 'Working directory (defaults to current directory)')
  .option('--debug', 'Enable debug logging to ~/.git-rake/logs/git-rake.log')

// Remote branch functionality is not fully implemented yet, so we only enable it in dev mode
if (process.env.DEV === 'true') {
  program.option('-r, --include-remote', 'Include remote tracking branches')
}

// Base command reserved for future functionality
program.action(async () => {
  console.log('Available commands:')
  console.log(
    '  trash, branch      Interactive branch management (trash/delete)',
  )
  console.log('  trash --list       List trashed branches')
  console.log('  trash --prune      Prune old trash entries')
  console.log('  trash <branch>     Move branch to trash')
  console.log('  restore            Interactive restore mode')
  console.log('  restore <branch>   Restore specific branch')
  console.log('')
  console.log('Aliases:')
  console.log('  branch             Alias for trash command')
  console.log('')
  console.log(
    'Run "git-rake <command> --help" for more information on a command.',
  )
  process.exit(0)
})

program
  .command('restore')
  .argument(
    '[branch-name]',
    '(Optional) Name of individual branch to restore from trash.',
  )
  .description('Restore branches from trash.')
  .summary(
    'You can either restore a single branch or enter interactive mode to restore multiple branches.',
  )
  .action(restoreCommand)

program
  .command('trash')
  .alias('branch')
  .argument('[branch-name]', '(Optional) Name of individual branch to trash.')
  .option('-l, --list', 'List trashed branches')
  .option('-p, --prune', 'Prune old entries from trash')
  .description(
    'Interactive branch management (trash/delete), list trashed branches, move branches to trash, or prune old trash',
  )
  .summary(
    'Enter interactive mode for branch management (default), list trashed branches (--list), move a specific branch to trash (<branch-name>), or prune old trash (--prune). Alias: branch',
  )
  .action(trashCommand)

program.parseAsync()

export { App }
