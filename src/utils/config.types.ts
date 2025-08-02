import type { GitConfig } from '@services/GitRepository.types.js'

export type GitRakeConfig = GitConfig & {
  theme: string
  includeRemote: boolean
  autoCleanupTrash: boolean
  excludedBranches: string[]
}
