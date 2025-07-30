export type GitBranch = {
  name: string
  ref: string
  isCurrent: boolean
  isRemote: boolean
  lastCommitDate: Date
  lastCommitMessage: string
  lastCommitHash: string
  lastCommitAuthor: string
  isMerged: boolean
  isStale: boolean
  staleDays: number
  upstreamBranch: string | null
  upstreamTrack: string | null
  upstreamTrackShort: string | null
}

export type GitTrashBranch = GitBranch & {
  deletionDate: Date
}

export type GitConfig = {
  staleDaysThreshold: number
  trashTtlDays: number
  mergeCompareBranch: string
  excludedBranches: string[]
}

export type GitBranchOperation = {
  type: 'delete' | 'restore' | 'prune' | 'trash'
  branch: GitBranch
}

export type RefOperation = {
  name: string
  sha: string
}
