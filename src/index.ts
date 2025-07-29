import { Command } from 'commander'
import { App } from '@views/app/App.js'
import { interactiveAppInit, nonInteractiveAppInit } from '@utils/bootstrap.js'
import { GitTrashBranch } from '@services/GitRepository.types.js'

const program = new Command()

type CommandOptions = {
  cwd?: string
  includeRemote?: boolean
  debug?: boolean
}

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

program.action(async (_options: CommandOptions, command: Command) =>
  interactiveAppInit(command),
)

program
  .command('clean')
  .description('Clean up local branches interactively')
  .action(async (options: CommandOptions, command: Command) => {
    interactiveAppInit(command, {
      includeRemote: options.includeRemote || null,
    })
  })

const restoreCommandNonInteractive = async (
  branchName: string,
  command: Command,
) => {
  const { gitRepo } = await nonInteractiveAppInit(command)

  if (!branchName) {
    console.error('No branch name provided')
    process.exit(1)
  }

  try {
    const cleanBranchName = gitRepo.parseUserInput(branchName, 'trash')
    await gitRepo.restoreBranchFromTrash(cleanBranchName)
    console.log(`✅ Restored branch: ${cleanBranchName}`)
    process.exit(0)
  } catch (error) {
    console.error(
      `❌ Failed to restore branch ${branchName}:`,
      error instanceof Error ? error.message : error,
    )
    process.exit(1)
  }
}

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
  .action(
    async (
      branchName: string | undefined,
      _options: CommandOptions,
      command: Command,
    ) => {
      if (!branchName) {
        interactiveAppInit(command, {
          restoreMode: true,
        })
      } else {
        restoreCommandNonInteractive(branchName, command)
      }
    },
  )

const trashCommandList = async (command: Command) => {
  const { gitRepo } = await nonInteractiveAppInit(command)
  try {
    const trashBranches = await gitRepo.getBranches('trash')

    if (trashBranches.length === 0) {
      console.log('No branches in trash')
      process.exit(0)
    }

    console.log('Branches in trash:')
    trashBranches.forEach((branch: GitTrashBranch) => {
      console.log(
        `  • ${branch.name} (${branch.deletionDate.toLocaleDateString()})`,
      )
    })
    process.exit(0)
  } catch (error) {
    console.error(
      'Failed to list trash:',
      error instanceof Error ? error.message : error,
    )
    process.exit(1)
  }
}

const trashCommandMoveToTrash = async (
  branchName: string,
  command: Command,
) => {
  const { gitRepo } = await nonInteractiveAppInit(command)
  try {
    const cleanBranchName = gitRepo.parseUserInput(branchName, 'heads')
    await gitRepo.moveBranchToTrash(cleanBranchName)
    console.log(`✅ Moved branch ${cleanBranchName} to trash`)
    process.exit(0)
  } catch (error) {
    console.error(`❌ Failed to move branch ${branchName} to trash:`)
    console.error(error)
    process.exit(1)
  }
}

program
  .command('trash')
  .argument('[branch-name]', '(Optional) Name of individual branch to trash.')
  .description('List trashed branches or move branches to trash')
  .summary(
    `If you don't provide a branch name, it will list all trashed branches. If you provide a branch name, it will move that branch to trash.`,
  )
  .action(
    async (
      branchName: string | undefined,
      _options: CommandOptions,
      command: Command,
    ) => {
      if (!branchName) {
        trashCommandList(command)
      } else {
        trashCommandMoveToTrash(branchName, command)
      }
    },
  )

program
  .command('cleanup')
  .description('Clean up old entries from trash')
  .action(async (_options: CommandOptions, command: Command) => {
    const { gitRepo } = await nonInteractiveAppInit(command)

    try {
      await gitRepo.cleanupTrash()
      console.log('✅ Cleaned up old trash entries')
      process.exit(0)
    } catch (error) {
      console.error(
        'Failed to cleanup trash:',
        error instanceof Error ? error.message : error,
      )
      process.exit(1)
    }
  })

program.parseAsync()

export { App }
