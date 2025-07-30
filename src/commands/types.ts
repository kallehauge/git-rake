import { Command } from 'commander'

export type CommandOptions = {
  cwd?: string
  includeRemote?: boolean
  debug?: boolean
}

export type RestoreCommandOptions = CommandOptions

export type TrashCommandOptions = CommandOptions & {
  list?: boolean
  prune?: boolean
}

export type CommandAction<T = CommandOptions> = (
  branchName: string | undefined,
  options: T,
  command: Command,
) => Promise<void>
