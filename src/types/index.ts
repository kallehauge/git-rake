export interface GitBranch {
  name: string;
  ref: string;
  isCurrent: boolean;
  isLocal: boolean;
  isRemote: boolean;
  lastCommitDate: Date;
  lastCommitMessage: string;
  lastCommitHash: string;
  lastCommitAuthor?: string;
  isMerged: boolean;
  isStale: boolean;
  staleDays?: number;
  aheadBy?: number;
  behindBy?: number;
}

export interface GitConfig {
  staleDaysThreshold: number;
  trashNamespace: string;
  trashTtlDays: number;
}

export interface FilterOptions {
  showMerged: boolean;
  showUnmerged: boolean;
  showStale: boolean;
  showLocal: boolean;
  showRemote: boolean;
}

export interface BranchOperation {
  type: 'delete' | 'restore' | 'prune';
  branch: GitBranch;
  dryRun: boolean;
}

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    text: string;
    background: string;
    border: string;
  };
}

export type FilterType = 'all' | 'merged' | 'stale' | 'unmerged';