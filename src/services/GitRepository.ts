import { simpleGit, SimpleGit } from 'simple-git';
import { differenceInDays } from 'date-fns';

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

export interface GitBranchOperation {
  type: 'delete' | 'restore' | 'prune';
  branch: GitBranch;
}

export class GitRepository {
  private git: SimpleGit;
  private config: GitConfig;

  constructor(workingDir?: string, config?: Partial<GitConfig>) {
    this.git = simpleGit(workingDir || process.cwd());
    this.config = {
      staleDaysThreshold: 30,
      trashNamespace: 'refs/rake-trash',
      trashTtlDays: 90,
      ...config,
    };
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || 'HEAD';
  }

  async getAllBranches(includeRemote = false): Promise<GitBranch[]> {
    const branches: GitBranch[] = [];

    const localBranches = await this.git.branchLocal();
    const currentBranch = await this.getCurrentBranch();

    for (const branchName of Object.keys(localBranches.branches)) {
      const branch = await this.getBranchInfo(branchName, true, currentBranch);
      if (branch) {
        branches.push(branch);
      }
    }

    if (includeRemote) {
      try {
        const remoteBranches = await this.git.branch(['-r']);
        for (const branchName of Object.keys(remoteBranches.branches)) {
          if (!branchName.includes('HEAD')) {
            const branch = await this.getBranchInfo(branchName, false, currentBranch);
            if (branch) {
              branches.push(branch);
            }
          }
        }
      } catch (error) {
        console.warn('Could not fetch remote branches:', error);
      }
    }

    return branches;
  }

  private async getBranchInfo(
    branchName: string,
    isLocal: boolean,
    currentBranch: string
  ): Promise<GitBranch | null> {
    try {
      const cleanBranchName = branchName.replace('origin/', '');
      const ref = isLocal ? `refs/heads/${branchName}` : `refs/remotes/${branchName}`;

      const log = await this.git.log([
        '--max-count=1',
        branchName
      ]);

      if (!log.latest) {
        return null;
      }

      const lastCommitDate = new Date(log.latest.date);
      const staleDays = differenceInDays(new Date(), lastCommitDate);
      const isStale = staleDays > this.config.staleDaysThreshold;

      // Get author information
      let lastCommitAuthor: string | undefined;
      try {
        lastCommitAuthor = log.latest.author_name;
      } catch {
        // Ignore author fetch errors
      }

      let isMerged = false;
      let aheadBy: number | undefined;
      let behindBy: number | undefined;

      try {
        if (isLocal && branchName !== currentBranch) {
          // Check if merged
          const mergedBranches = await this.git.raw(['branch', '--merged']);
          isMerged = mergedBranches.includes(branchName);

          // Get ahead/behind counts relative to main/master
          try {
            const mainBranch = currentBranch === 'main' ? 'main' : 'master';
            const aheadBehind = await this.git.raw(['rev-list', '--left-right', '--count', `${mainBranch}...${branchName}`]);
            const counts = aheadBehind.trim().split('\t');
            if (counts.length === 2) {
              behindBy = parseInt(counts[0]) || 0;
              aheadBy = parseInt(counts[1]) || 0;
            }
          } catch {
            // Ignore ahead/behind calculation errors
          }
        }
      } catch {
        // Ignore merge check errors
      }

      return {
        name: cleanBranchName,
        ref,
        isCurrent: branchName === currentBranch,
        isLocal,
        isRemote: !isLocal,
        lastCommitDate,
        lastCommitMessage: log.latest.message,
        lastCommitHash: log.latest.hash,
        lastCommitAuthor,
        isMerged,
        isStale,
        staleDays,
        aheadBy,
        behindBy,
      };
    } catch (error) {
      console.error(`Error getting info for branch ${branchName}:`, error);
      return null;
    }
  }

  async deleteBranch(branchName: string, force = false): Promise<void> {
    await this.git.deleteLocalBranch(branchName, force);
  }

  async moveBranchToTrash(branchName: string): Promise<void> {
    const trashRef = `${this.config.trashNamespace}/${branchName}`;

    // Create trash ref before deleting branch
    await this.git.raw(['update-ref', trashRef, `refs/heads/${branchName}`]);

    // Delete the original branch
    await this.deleteBranch(branchName, true);
  }

  async restoreBranchFromTrash(branchName: string): Promise<void> {
    const trashRef = `${this.config.trashNamespace}/${branchName}`;

    try {
      // Check if trash ref exists
      await this.git.raw(['show-ref', '--verify', trashRef]);

      // Restore branch from trash
      await this.git.raw(['update-ref', `refs/heads/${branchName}`, trashRef]);

      // Remove from trash
      await this.git.raw(['update-ref', '-d', trashRef]);
    } catch (error) {
      throw new Error(`Branch ${branchName} not found in trash or could not be restored`);
    }
  }

  async getTrashBranches(): Promise<string[]> {
    try {
      const refs = await this.git.raw(['for-each-ref', '--format=%(refname:short)', `${this.config.trashNamespace}/*`]);
      return refs.trim().split('\n').filter(Boolean).map(ref => ref.replace(`${this.config.trashNamespace}/`, ''));
    } catch {
      return [];
    }
  }

  async cleanupTrash(): Promise<void> {
    const trashBranches = await this.getTrashBranches();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.trashTtlDays);

    for (const branchName of trashBranches) {
      try {
        const trashRef = `${this.config.trashNamespace}/${branchName}`;
        const log = await this.git.raw(['log', '-1', '--format=%ci', trashRef]);
        const commitDate = new Date(log.trim());

        if (commitDate < cutoffDate) {
          await this.git.raw(['update-ref', '-d', trashRef]);
        }
      } catch {
        // Ignore errors for individual branches
      }
    }
  }

  async pruneRemoteBranches(): Promise<string[]> {
    try {
      const result = await this.git.raw(['remote', 'prune', 'origin', '--dry-run']);
      const prunedBranches = result
        .split('\n')
        .filter(line => line.includes('origin/'))
        .map(line => line.match(/origin\/(.+)/)?.[1])
        .filter(Boolean) as string[];

      return prunedBranches;
    } catch {
      return [];
    }
  }

  async executePruneRemoteBranches(): Promise<void> {
    await this.git.raw(['remote', 'prune', 'origin']);
  }

  async getBranchLog(branchName: string, maxCount = 10): Promise<string> {
    try {
      const log = await this.git.raw([
        'log',
        '--oneline',
        '--graph',
        '--decorate',
        `--max-count=${maxCount}`,
        branchName
      ]);
      return log;
    } catch {
      return 'No commits found';
    }
  }

  async performBatchOperations(operations: GitBranchOperation[]): Promise<void> {
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'delete':
            await this.moveBranchToTrash(operation.branch.name);
            break;
          case 'restore':
            await this.restoreBranchFromTrash(operation.branch.name);
            break;
          case 'prune':
            await this.executePruneRemoteBranches();
            break;
        }
      } catch (error) {
        console.error(`Failed to ${operation.type} branch ${operation.branch.name}:`, error);
      }
    }
  }
}
