import { simpleGit, SimpleGit } from 'simple-git'
import { differenceInDays } from 'date-fns'

export interface GitBranch {
  name: string
  ref: string
  isCurrent: boolean
  isLocal: boolean
  isRemote: boolean
  lastCommitDate: Date
  lastCommitMessage: string
  lastCommitHash: string
  lastCommitAuthor?: string
  isMerged: boolean
  isStale: boolean
  staleDays?: number
  aheadBy?: number
  behindBy?: number
}

export interface GitConfig {
  staleDaysThreshold: number
  trashNamespace: string
  trashTtlDays: number
}

export interface GitBranchOperation {
  type: 'delete' | 'restore' | 'prune'
  branch: GitBranch
}

export interface BranchData {
  refname: string
  shortname: string
  date: Date
  subject: string
  hash: string
  author: string
}

export class GitRepository {
  private git: SimpleGit
  private config: GitConfig

  constructor(workingDir?: string, config?: Partial<GitConfig>) {
    this.git = simpleGit(workingDir || process.cwd())
    this.config = {
      staleDaysThreshold: 30,
      trashNamespace: 'refs/rake-trash',
      trashTtlDays: 90,
      ...config,
    }
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status()
      return true
    } catch {
      return false
    }
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status()
    return status.current || 'HEAD'
  }

  async getAllBranches(includeRemote = false): Promise<GitBranch[]> {
    const currentBranch = await this.getCurrentBranch()

    // Get all branch information in batch operations
    const [localBranchData, remoteBranchData, mergedBranches] =
      await Promise.all([
        this.getBatchBranchInfo('refs/heads'),
        includeRemote
          ? this.getBatchBranchInfo('refs/remotes')
          : Promise.resolve([]),
        this.getMergedBranches(),
      ])

    // Get ahead/behind data for all local branches at once
    const aheadBehindData = await this.getBatchAheadBehindData(
      localBranchData.map(b => b.shortname),
      currentBranch,
    )

    const branches: GitBranch[] = []

    // Process local branches
    for (const branchData of localBranchData) {
      const branch = this.createBranchFromBatchData(
        branchData,
        true,
        currentBranch,
        mergedBranches,
        aheadBehindData,
      )
      if (branch) {
        branches.push(branch)
      }
    }

    // Process remote branches
    for (const branchData of remoteBranchData) {
      if (!branchData.refname.includes('HEAD')) {
        const branch = this.createBranchFromBatchData(
          branchData,
          false,
          currentBranch,
          mergedBranches,
        )
        if (branch) {
          branches.push(branch)
        }
      }
    }

    return branches
  }

  private async getBatchBranchInfo(refsPattern: string): Promise<BranchData[]> {
    try {
      const format = [
        '%(refname)',
        '%(refname:short)',
        '%(committerdate:iso)',
        '%(subject)',
        '%(objectname:short)',
        '%(authorname)',
      ].join('%09') // Tab separator

      const result = await this.git.raw([
        'for-each-ref',
        `--format=${format}`,
        refsPattern,
      ])

      return result
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [refname, shortname, date, subject, hash, author] =
            line.split('\t')
          return {
            refname,
            shortname,
            date: new Date(date),
            subject: subject || '',
            hash: hash || '',
            author: author || '',
          }
        })
    } catch (error) {
      console.error(
        `Error getting batch branch info for ${refsPattern}:`,
        error,
      )
      return []
    }
  }

  private async getMergedBranches(): Promise<Set<string>> {
    try {
      const result = await this.git.raw(['branch', '--merged'])
      const mergedSet = new Set<string>()

      result
        .split('\n')
        .map(line => line.trim().replace(/^\*?\s*/, ''))
        .filter(Boolean)
        .forEach(branch => mergedSet.add(branch))

      return mergedSet
    } catch (error) {
      console.error('Error getting merged branches:', error)
      return new Set()
    }
  }

  private async getBatchAheadBehindData(
    branchNames: string[],
    currentBranch: string,
  ): Promise<Map<string, { aheadBy: number; behindBy: number }>> {
    const aheadBehindMap = new Map<
      string,
      { aheadBy: number; behindBy: number }
    >()

    try {
      const mainBranch = currentBranch === 'main' ? 'main' : 'master'

      // Filter out current branch and non-local branches
      const branchesToCheck = branchNames.filter(
        branch => branch !== currentBranch,
      )

      // Batch process all branches at once using rev-list
      const promises = branchesToCheck.map(async branchName => {
        try {
          const result = await this.git.raw([
            'rev-list',
            '--left-right',
            '--count',
            `${mainBranch}...${branchName}`,
          ])
          const counts = result.trim().split('\t')
          if (counts.length === 2) {
            const behindBy = parseInt(counts[0]) || 0
            const aheadBy = parseInt(counts[1]) || 0
            aheadBehindMap.set(branchName, { aheadBy, behindBy })
          }
        } catch {
          // Ignore individual branch errors
        }
      })

      await Promise.all(promises)
    } catch (error) {
      console.error('Error getting batch ahead/behind data:', error)
    }

    return aheadBehindMap
  }

  private createBranchFromBatchData(
    branchData: BranchData,
    isLocal: boolean,
    currentBranch: string,
    mergedBranches: Set<string>,
    aheadBehindData?: Map<string, { aheadBy: number; behindBy: number }>,
  ): GitBranch | null {
    try {
      const cleanBranchName = branchData.shortname.replace('origin/', '')
      const staleDays = differenceInDays(new Date(), branchData.date)
      const isStale = staleDays > this.config.staleDaysThreshold
      const isMerged = mergedBranches.has(branchData.shortname)

      // Get ahead/behind counts from pre-computed data
      const aheadBehindInfo = aheadBehindData?.get(branchData.shortname)
      const aheadBy = aheadBehindInfo?.aheadBy
      const behindBy = aheadBehindInfo?.behindBy

      return {
        name: cleanBranchName,
        ref: branchData.refname,
        isCurrent: branchData.shortname === currentBranch,
        isLocal,
        isRemote: !isLocal,
        lastCommitDate: branchData.date,
        lastCommitMessage: branchData.subject,
        lastCommitHash: branchData.hash,
        lastCommitAuthor: branchData.author,
        isMerged,
        isStale,
        staleDays,
        aheadBy,
        behindBy,
      }
    } catch (error) {
      console.error(
        `Error creating branch from batch data for ${branchData.shortname}:`,
        error,
      )
      return null
    }
  }

  async deleteBranch(branchName: string, force = false): Promise<void> {
    await this.git.deleteLocalBranch(branchName, force)
  }

  async moveBranchToTrash(branchName: string): Promise<void> {
    const trashRef = `${this.config.trashNamespace}/${branchName}`

    // Create trash ref before deleting branch
    await this.git.raw(['update-ref', trashRef, `refs/heads/${branchName}`])

    // Delete the original branch
    await this.deleteBranch(branchName, true)
  }

  async restoreBranchFromTrash(branchName: string): Promise<void> {
    const trashRef = `${this.config.trashNamespace}/${branchName}`

    try {
      // Check if trash ref exists
      await this.git.raw(['show-ref', '--verify', trashRef])

      // Restore branch from trash
      await this.git.raw(['update-ref', `refs/heads/${branchName}`, trashRef])

      // Remove from trash
      await this.git.raw(['update-ref', '-d', trashRef])
    } catch (error) {
      throw new Error(
        `Branch ${branchName} not found in trash or could not be restored`,
      )
    }
  }

  async getTrashBranches(): Promise<string[]> {
    try {
      const refs = await this.git.raw([
        'for-each-ref',
        '--format=%(refname:short)',
        `${this.config.trashNamespace}/*`,
      ])
      return refs
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(ref => ref.replace(`${this.config.trashNamespace}/`, ''))
    } catch {
      return []
    }
  }

  async cleanupTrash(): Promise<void> {
    const trashBranches = await this.getTrashBranches()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.trashTtlDays)

    for (const branchName of trashBranches) {
      try {
        const trashRef = `${this.config.trashNamespace}/${branchName}`
        const log = await this.git.raw(['log', '-1', '--format=%ci', trashRef])
        const commitDate = new Date(log.trim())

        if (commitDate < cutoffDate) {
          await this.git.raw(['update-ref', '-d', trashRef])
        }
      } catch {
        // Ignore errors for individual branches
      }
    }
  }

  async pruneRemoteBranches(): Promise<string[]> {
    try {
      const result = await this.git.raw([
        'remote',
        'prune',
        'origin',
        '--dry-run',
      ])
      const prunedBranches = result
        .split('\n')
        .filter(line => line.includes('origin/'))
        .map(line => line.match(/origin\/(.+)/)?.[1])
        .filter(Boolean) as string[]

      return prunedBranches
    } catch {
      return []
    }
  }

  async executePruneRemoteBranches(): Promise<void> {
    await this.git.raw(['remote', 'prune', 'origin'])
  }

  async getBranchLog(branchName: string, maxCount = 10): Promise<string> {
    try {
      const log = await this.git.raw([
        'log',
        '--oneline',
        '--graph',
        '--decorate',
        `--max-count=${maxCount}`,
        branchName,
      ])
      return log
    } catch {
      return 'No commits found'
    }
  }

  async performBatchOperations(
    operations: GitBranchOperation[],
  ): Promise<void> {
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'delete':
            await this.moveBranchToTrash(operation.branch.name)
            break
          case 'restore':
            await this.restoreBranchFromTrash(operation.branch.name)
            break
          case 'prune':
            await this.executePruneRemoteBranches()
            break
        }
      } catch (error) {
        console.error(
          `Failed to ${operation.type} branch ${operation.branch.name}:`,
          error,
        )
      }
    }
  }
}
