import type { GitBranch } from '@services/GitRepository.types.js'
import type { StatusBarInfo } from '@utils/derivedState.js'

export type BranchContextData = {
  branches: GitBranch[]
  filteredBranches: GitBranch[]
  selectedBranches: GitBranch[]
  currentBranch: GitBranch | null
  statusBarInfo: StatusBarInfo
}
