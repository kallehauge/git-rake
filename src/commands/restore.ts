import { Command } from 'commander'
import { interactiveAppInit, nonInteractiveAppInit } from '@utils/bootstrap.js'
import { CommandAction, RestoreCommandOptions } from './types.js'

export async function restoreSpecificBranch(
  branchName: string,
  command: Command,
): Promise<void> {
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

export const restoreCommand: CommandAction<RestoreCommandOptions> = async (
  branchName,
  _options,
  command,
) => {
  if (!branchName) {
    interactiveAppInit(command, {
      restoreMode: true,
    })
  } else {
    await restoreSpecificBranch(branchName, command)
  }
}
