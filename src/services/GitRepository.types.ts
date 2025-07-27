export type GitBranch = {
  name: string
  ref: string
  isCurrent: boolean
  isLocal: boolean
  isRemote: boolean
  lastCommitDate: Date
  lastCommitMessage: string
  lastCommitHash: string
  lastCommitAuthor: string
  isMerged: boolean
  isStale: boolean
  staleDays: number
  aheadBy?: number
  behindBy?: number
}

export type GitConfig = {
  staleDaysThreshold: number
  trashNamespace: string
  trashTtlDays: number
  mainBranch: string
  excludedBranches: string[]
}

export type GitBranchOperation = {
  type: 'delete' | 'restore' | 'prune' | 'trash'
  branch: GitBranch
}
