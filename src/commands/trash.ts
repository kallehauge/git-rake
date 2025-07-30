import { Command } from 'commander'
import { interactiveAppInit, nonInteractiveAppInit } from '@utils/bootstrap.js'
import { GitTrashBranch } from '@services/GitRepository.types.js'
import { CommandAction, TrashCommandOptions } from './types.js'

export async function listTrashBranches(command: Command): Promise<void> {
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

export async function moveToTrash(
  branchName: string,
  command: Command,
): Promise<void> {
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

export async function pruneTrash(command: Command): Promise<void> {
  const { gitRepo } = await nonInteractiveAppInit(command)
  try {
    await gitRepo.cleanupTrash()
    console.log('✅ Pruned old trash entries')
    process.exit(0)
  } catch (error) {
    console.error(
      'Failed to prune trash:',
      error instanceof Error ? error.message : error,
    )
    process.exit(1)
  }
}

export const trashCommand: CommandAction<TrashCommandOptions> = async (
  branchName,
  options,
  command,
) => {
  if (options.prune) {
    await pruneTrash(command)
  } else if (options.list) {
    await listTrashBranches(command)
  } else if (branchName) {
    await moveToTrash(branchName, command)
  } else {
    interactiveAppInit(command)
  }
}
