import { simpleGit, SimpleGit } from 'simple-git'
import { differenceInDays } from 'date-fns'
import { spawn } from 'child_process'
import { logger } from '@utils/logger.js'
import type {
  GitBranch,
  GitConfig,
  GitBranchOperation,
  RawBranchData,
} from './GitRepository.types.js'

export class GitRepository {
  private git: SimpleGit
  private trashNamespace: string
  private trashNamespaceWithoutRefs: string
  private mainBranch: string
  private workingDir: string
  private trashTtlDays: number
  private staleDaysThreshold: number
  private excludedBranches: string[]

  constructor(config: GitConfig, workingDir?: string) {
    this.workingDir = workingDir || process.cwd()
    this.git = simpleGit(this.workingDir)
    this.mainBranch = config.mainBranch
    this.trashNamespace = `${config.trashNamespace.replace(/\/$/, '')}/`
    this.trashNamespaceWithoutRefs = this.trashNamespace.replace('refs/', '')
    this.trashTtlDays = config.trashTtlDays
    this.staleDaysThreshold = config.staleDaysThreshold
    this.excludedBranches = config.excludedBranches
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

    const branches: GitBranch[] = []

    // Process local branches
    for (const branchData of localBranchData) {
      const branch = this.createBranchFromBatchData(
        branchData,
        true,
        currentBranch,
        mergedBranches,
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

  private async getBatchBranchInfo(
    refsPattern: string,
  ): Promise<RawBranchData[]> {
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
      logger.error('Error getting batch branch info', {
        refsPattern,
        error: error instanceof Error ? error.message : String(error),
      })
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
      logger.error('Error getting merged branches', {
        error: error instanceof Error ? error.message : String(error),
      })
      return new Set()
    }
  }

  async getBranchAheadBehind(
    branchName: string,
    currentBranch?: string,
  ): Promise<{ aheadBy: number; behindBy: number } | null> {
    try {
      const baseBranch = currentBranch || (await this.getCurrentBranch())
      const mainBranch = this.mainBranch

      if (branchName === baseBranch || branchName === mainBranch) {
        return null
      }

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
        return { aheadBy, behindBy }
      }

      return null
    } catch (error) {
      logger.error('Error getting ahead/behind data for branch', {
        branchName,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  private createBranchFromBatchData(
    branchData: RawBranchData,
    isLocal: boolean,
    currentBranch: string,
    mergedBranches: Set<string>,
  ): GitBranch | null {
    try {
      const cleanBranchName = branchData.shortname.replace('origin/', '')

      // Filter out excluded branches
      if (this.excludedBranches.includes(cleanBranchName)) {
        return null
      }

      const staleDays = differenceInDays(new Date(), branchData.date)
      const isStale = staleDays > this.staleDaysThreshold
      const isMerged = mergedBranches.has(branchData.shortname)

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
        aheadBy: undefined,
        behindBy: undefined,
      }
    } catch (error) {
      logger.error('Error creating branch from batch data', {
        shortname: branchData.shortname,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  async deleteBranch(branchName: string, force = false): Promise<void> {
    await this.git.deleteLocalBranch(branchName, force)
  }

  async moveBranchToTrash(branchName: string): Promise<void> {
    const trashRef = `${this.trashNamespace}${branchName}`
    const headRef = `refs/heads/${branchName}`

    // Get SHA first, then batch the ref operations for atomicity
    const sha = await this.git.raw(['rev-parse', headRef])
    await this.executeBatchRefUpdates([
      { action: 'create', ref: trashRef, value: sha.trim() },
      { action: 'delete', ref: headRef },
    ])

    // Git notes operations can't be batched with `git update-ref --stdin`
    // This is a git limitation, not a design choice
    await this.setTrashDeletionDate(trashRef)
  }

  /**
   * Moves multiple branches to trash in a single batch operation
   *
   * Architecture: For N branches, executes (N+2) git operations:
   * - N rev-parse calls to get SHAs (parallel, git doesn't support batch rev-parse)
   * - 1 batch ref update for all creates/deletes (atomic via `git update-ref --stdin`)
   * - N git notes calls for deletion dates (parallel, `git notes` lacks batch interface)
   */
  async moveBranchesToTrash(branchNames: string[]): Promise<void> {
    if (branchNames.length === 0) return

    // Fetch all branch SHAs in parallel since `git rev-parse` doesn't support batch input
    // Concurrent execution scales much better than sequential for large branch sets
    const branchData = await Promise.all(
      branchNames.map(async name => {
        try {
          const sha = await this.git.raw(['rev-parse', `refs/heads/${name}`])
          return { name, sha: sha.trim() }
        } catch {
          // Branch doesn't exist - filter out later
          return null
        }
      }),
    )

    const validBranches = branchData.filter(Boolean) as Array<{
      name: string
      sha: string
    }>

    // Create atomic batch: for each branch, create trash ref then delete original.
    // Git ensures this happens atomically. If any command fails, none are applied.
    const commands = validBranches.flatMap(({ name, sha }) => [
      {
        action: 'create' as const,
        ref: `${this.trashNamespace}${name}`,
        value: sha,
      },
      { action: 'delete' as const, ref: `refs/heads/${name}` },
    ])

    await this.executeBatchRefUpdates(commands)

    // Git notes lack batch interface, but parallel execution still provides some scalability
    await Promise.all(
      validBranches.map(({ name }) =>
        this.setTrashDeletionDate(`${this.trashNamespace}${name}`),
      ),
    )
  }

  private getTrashRefFromUserInput(branchName: string): string {
    let trashNamespaceWithoutRefs = this.trashNamespace.replace('refs/', '')
    branchName = branchName.replace('refs/', '')
    branchName = branchName.replace(trashNamespaceWithoutRefs, '')
    return `${this.trashNamespace}${branchName.trim()}`
  }

  async restoreBranchFromTrash(
    branchName: string,
  ): Promise<{ oldRef: string; newRef: string }> {
    const trashRef = this.getTrashRefFromUserInput(branchName)
    const branchNameWithoutTrashNamespace = trashRef.replace(
      this.trashNamespace,
      '',
    )
    const newRef = `refs/heads/${branchNameWithoutTrashNamespace}`

    try {
      // Get SHA from trash ref. This also serves as existence verification.
      // Atomic batch restore: create branch ref then delete trash ref.
      const sha = await this.git.raw(['rev-parse', trashRef])
      await this.executeBatchRefUpdates([
        { action: 'create', ref: newRef, value: sha.trim() },
        { action: 'delete', ref: trashRef },
      ])

      // Clean up deletion date note
      await this.removeTrashDeletionDate(trashRef)

      return {
        oldRef: trashRef,
        newRef,
      }
    } catch (error) {
      logger.error('Error restoring branch from trash', {
        branchName,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new Error(
        `Branch ${branchName} not found in trash or could not be restored`,
      )
    }
  }

  /**
   * Restores multiple branches from trash in a single batch operation.
   *
   * Architecture: For N branches, executes (N+2) git operations:
   * - N rev-parse calls to get trash SHAs (parallel, also serves as existence verification)
   * - 1 batch ref update for all creates/deletes (atomic via git update-ref --stdin)
   * - N note deletion calls (parallel, git notes lacks batch interface)
   *
   * Critical: Order matters in batch commands. We have to create new ref before deleting
   * trash ref to prevent race conditions if the same SHA is referenced elsewhere.
   */
  async restoreBranchesFromTrash(
    branchNames: string[],
  ): Promise<Array<{ oldRef: string; newRef: string }>> {
    if (branchNames.length === 0) return []

    // Validate all trash refs exist and get their SHAs in parallel
    // This also serves as existence verification - failed rev-parse means no trash entry
    const restoreData = await Promise.all(
      branchNames.map(async name => {
        try {
          const trashRef = this.getTrashRefFromUserInput(name)
          const sha = await this.git.raw(['rev-parse', trashRef])
          const branchNameClean = trashRef.replace(this.trashNamespace, '')
          return {
            branchName: name,
            trashRef,
            newRef: `refs/heads/${branchNameClean}`,
            sha: sha.trim(),
          }
        } catch {
          // Skip restore if trash ref doesn't exist
          return null
        }
      }),
    )

    const validRestores = restoreData.filter(Boolean) as Array<{
      branchName: string
      trashRef: string
      newRef: string
      sha: string
    }>

    // Atomic batch restore: create branch ref then delete trash ref
    // Order is critical: create first to ensure SHA remains referenced
    const commands = validRestores.flatMap(({ trashRef, newRef, sha }) => [
      { action: 'create' as const, ref: newRef, value: sha },
      { action: 'delete' as const, ref: trashRef },
    ])

    await this.executeBatchRefUpdates(commands)

    // Parallel cleanup of deletion date notes
    await Promise.all(
      validRestores.map(({ trashRef }) =>
        this.removeTrashDeletionDate(trashRef),
      ),
    )

    return validRestores.map(({ trashRef, newRef }) => ({
      oldRef: trashRef,
      newRef,
    }))
  }

  async getTrashBranches(): Promise<string[]> {
    try {
      const refs = await this.git.raw([
        'for-each-ref',
        '--format=%(refname:short)',
        this.trashNamespace,
      ])
      return refs
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(ref => ref.replace(this.trashNamespaceWithoutRefs, ''))
    } catch {
      return []
    }
  }

  /**
   * Removes expired branches from trash using parallel processing and batch operations.
   *
   * Architecture: For N trash branches with M expired, executes (N+2) git operations:
   * - N git notes reads to check deletion dates (parallel, git notes lacks batch read)
   * - 1 batch delete command for all M expired trash refs (atomic)
   * - M note cleanup operations (parallel)
   */
  async cleanupTrash(): Promise<void> {
    const trashBranches = await this.getTrashBranches()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.trashTtlDays)

    // Parallel deletion date checks enable scalability for large trash collections
    // Sequential reads would block on each git notes operation individually
    const deletionChecks = await Promise.all(
      trashBranches.map(async branchName => {
        try {
          const trashRef = `${this.trashNamespace}/${branchName}`
          const deletionDateStr = await this.getTrashDeletionDate(trashRef)

          if (!deletionDateStr) {
            // Skip cleanup if branch was trashed before we implemented date tracking
            return null
          }

          const deletionDate = new Date(deletionDateStr)
          return {
            branchName,
            trashRef,
            shouldDelete: deletionDate < cutoffDate,
          }
        } catch (error) {
          logger.error('Could not check deletion date for branch', {
            branchName,
            error: error instanceof Error ? error.message : String(error),
          })
          return null
        }
      }),
    )

    const validChecks = deletionChecks.filter(Boolean) as Array<{
      branchName: string
      trashRef: string
      shouldDelete: boolean
    }>

    const toDelete = validChecks.filter(check => check.shouldDelete)

    if (toDelete.length === 0) return

    // Atomic batch deletion of all expired trash refs for consistency and efficiency
    const deleteCommands = toDelete.map(({ trashRef }) => ({
      action: 'delete' as const,
      ref: trashRef,
    }))

    await this.executeBatchRefUpdates(deleteCommands)

    // Parallel cleanup of associated deletion date notes
    await Promise.all(
      toDelete.map(({ trashRef }) => this.removeTrashDeletionDate(trashRef)),
    )
  }

  private async setTrashDeletionDate(trashRef: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const branchName = trashRef.replace(this.trashNamespace, '')
    try {
      await this.git.raw([
        'notes',
        `--ref=rake-trash-dates/${branchName}`,
        'add',
        '-f', // Force overwrite if note exists
        '-m',
        today,
        trashRef,
      ])
    } catch (error) {
      logger.error('Could not set deletion date for trash ref', {
        trashRef,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private async getTrashDeletionDate(trashRef: string): Promise<string | null> {
    const branchName = trashRef.replace(this.trashNamespace, '')
    try {
      const result = await this.git.raw([
        'notes',
        `--ref=rake-trash-dates/${branchName}`,
        'show',
        trashRef,
      ])
      return result.trim()
    } catch (error) {
      logger.error('Could not get deletion date for trash ref', {
        trashRef,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  private async removeTrashDeletionDate(trashRef: string): Promise<void> {
    const branchName = trashRef.replace(this.trashNamespace, '')
    try {
      await this.git.raw([
        'update-ref',
        '-d',
        `refs/notes/rake-trash-dates/${branchName}`,
      ])
    } catch (error) {
      logger.error('Could not remove deletion date for trash ref', {
        trashRef,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Executes multiple git ref updates atomically using `git update-ref --stdin`.
   *
   * Atomicity: All ref updates succeed together or all fail together.
   * Efficiency: Single git process handles multiple operations vs N separate spawns.
   *
   * Uses child_process.spawn instead of simple-git because:
   * - simple-git doesn't support stdin piping for batch operations
   * - We need precise control over stdin formatting (newline-terminated commands)
   * - Git's --stdin mode requires the input stream to be properly closed
   */
  private async executeBatchRefUpdates(
    commands: Array<{
      action: 'create' | 'update' | 'delete' | 'verify'
      ref: string
      value?: string
    }>,
  ): Promise<void> {
    if (commands.length === 0) return

    // Format commands according to `git update-ref --stdin` protocol
    // Each line: `action ref [value]` terminated with `\n`
    const stdin =
      commands
        .map(cmd => {
          switch (cmd.action) {
            case 'create':
              return `create ${cmd.ref} ${cmd.value}`
            case 'update':
              return `update ${cmd.ref} ${cmd.value}`
            case 'delete':
              return `delete ${cmd.ref}`
            case 'verify':
              return `verify ${cmd.ref} ${cmd.value || ''}`
            default:
              throw new Error(`Unknown action: ${cmd.action}`)
          }
        })
        .join('\n') + '\n'

    // Must use spawn because `git --stdin` requires proper stream handling
    // that simple-git doesn't provide for this specific use case
    return new Promise((resolve, reject) => {
      const gitProcess = spawn('git', ['update-ref', '--stdin'], {
        cwd: this.workingDir,
      })

      let stderr = ''

      gitProcess.stderr.on('data', data => {
        stderr += data.toString()
      })

      gitProcess.on('close', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`git update-ref --stdin failed: ${stderr}`))
        }
      })

      gitProcess.on('error', error => {
        reject(error)
      })

      gitProcess.stdin.write(stdin)
      gitProcess.stdin.end()
    })
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

  /**
   * Executes multiple branch operations with intelligent batching
   *
   * Groups operations by type because different operations require different git commands:
   * - trash/restore use `git update-ref --stdin` for atomic ref manipulation
   * - delete uses `git branch -D` for safety checks
   * - prune uses `git remote prune` (inherently single operation)
   */
  async performBatchOperations(
    operations: GitBranchOperation[],
  ): Promise<void> {
    // Group by operation type to enable batch processing
    // Mixed operation types can't be batched together due to different git command requirements
    const operationGroups = operations.reduce(
      (groups, op) => {
        groups[op.type].push(op)
        return groups
      },
      {
        trash: [] as GitBranchOperation[],
        delete: [] as GitBranchOperation[],
        restore: [] as GitBranchOperation[],
        prune: [] as GitBranchOperation[],
      },
    )

    if (operationGroups.trash.length > 0) {
      const branchNames = operationGroups.trash.map(op => op.branch.name)
      await this.moveBranchesToTrash(branchNames)
    }

    if (operationGroups.restore.length > 0) {
      const branchNames = operationGroups.restore.map(op => op.branch.name)
      await this.restoreBranchesFromTrash(branchNames)
    }

    // Delete operations remain individual because simple-git's `deleteLocalBranch`
    // doesn't provide batch interface and implementing custom batching
    // would require duplicating its safety checks.
    for (const op of operationGroups.delete) {
      await this.deleteBranch(op.branch.name, true)
    }

    // Prune is inherently a single operation but multiple prune requests
    // can be collapsed to one execution
    if (operationGroups.prune.length > 0) {
      await this.executePruneRemoteBranches()
    }
  }
}
