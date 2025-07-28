import { simpleGit, SimpleGit } from 'simple-git'
import { differenceInDays } from 'date-fns'
import { spawn } from 'child_process'
import { logger } from '@utils/logger.js'
import type {
  GitBranch,
  GitConfig,
  GitBranchOperation,
  RefOperation,
} from './GitRepository.types.js'

export class GitRepository {
  private git: SimpleGit
  private readonly NAMESPACES = {
    heads: {
      full: 'refs/heads/',
      short: 'heads/',
      // Slicing is more efficient than using replace(), and instead of running .length on every
      // branch name that we want to process, we can just use a constant.
      fullLength: 11,
      shortLength: 6,
    },
    trash: {
      full: 'refs/rake-trash/',
      short: 'rake-trash/',
      // Slicing is more efficient than using replace(), and instead of running .length on every
      // branch name that we want to process, we can just use a constant.
      fullLength: 16,
      shortLength: 11,
    },
    remotes: {
      full: 'refs/remotes/',
      short: 'remotes/',
      // Slicing is more efficient than using replace(), and instead of running .length on every
      // branch name that we want to process, we can just use a constant.
      fullLength: 13,
      shortLength: 8,
    },
  } as const
  private mainBranch: string
  private workingDir: string
  private trashTtlDays: number
  private staleDaysThreshold: number
  private excludedBranches: string[]

  constructor(config: GitConfig, workingDir?: string) {
    this.workingDir = workingDir || process.cwd()
    this.git = simpleGit(this.workingDir)
    this.mainBranch = config.mainBranch
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

  /**
   * Builds complete git ref from branch name and namespace
   *
   * E.g. "feature/auth", "heads" -> "refs/heads/feature/auth"
   */
  private buildFullRef(
    branchName: string,
    namespaceKey: keyof typeof this.NAMESPACES,
  ): string {
    return this.NAMESPACES[namespaceKey].full + branchName
  }

  /**
   * Parses user input to extract clean branch name
   *
   * Handles: "refs/rake-trash/branch", "rake-trash/branch", "branch"
   *
   * @todo This is a bit of a hack. We should probably use a more robust parser.
   */
  parseUserInput(
    input: string,
    targetNamespaceKey: keyof typeof this.NAMESPACES,
  ): string {
    const target = this.NAMESPACES[targetNamespaceKey]

    // Try full ref
    if (input.startsWith(target.full)) {
      return input.slice(target.fullLength)
    }

    // Try short ref
    if (input.startsWith(target.short)) {
      return input.slice(target.shortLength)
    }

    return input
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status()
    return status.current || 'HEAD'
  }

  private async getMergedHashes(refsNamespace: string): Promise<string[]> {
    try {
      const result = await this.git.raw([
        'for-each-ref',
        '--merged=' + this.mainBranch,
        '--format=%(objectname)',
        refsNamespace,
      ])
      return result.trim().split('\n').filter(Boolean)
    } catch (error) {
      logger.error('Error getting merged hashes', {
        refsNamespace,
        error: error instanceof Error ? error.message : String(error),
      })
      return []
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

  async deleteBranch(branchName: string, force = false): Promise<void> {
    await this.git.deleteLocalBranch(branchName, force)
  }

  async moveBranchToTrash(branchName: string): Promise<void> {
    await this.moveBranchesToTrash([branchName])
  }

  /**
   * Move multiple branches to trash
   */
  async moveBranchesToTrash(branchNames: string[]): Promise<void> {
    if (branchNames.length === 0) return

    const bulkOperations = await this.getBranchOperations(branchNames, 'heads')
    await this.trashBranchesWithRetry(bulkOperations)
  }

  async restoreBranchFromTrash(branchName: string): Promise<void> {
    await this.restoreBranchesFromTrash([branchName])
  }

  /**
   * Restores multiple branches from trash
   */
  async restoreBranchesFromTrash(branchNames: string[]): Promise<void> {
    if (branchNames.length === 0) return

    const bulkOperations = await this.getBranchOperations(branchNames, 'trash')
    await this.restoreBranchesWithRetry(bulkOperations)
  }

  /**
   * Get all branches in trash
   *
   * @todo Look for a way to use getBranches() or something similar to avoid duplicating code
   */
  async getTrashBranches(): Promise<string[]> {
    try {
      const refs = await this.git.raw([
        'for-each-ref',
        this.NAMESPACES.trash.full,
        '--format=%(refname:lstrip=2)',
        '--sort=-committerdate',
      ])
      return refs.trim().split('\n').filter(Boolean)
    } catch {
      return []
    }
  }

  /**
   * Get branches, with optional streaming callback
   */
  async getBranches(
    branchType: 'heads' | 'trash' | 'remotes',
    onUpdate?: (branch: GitBranch, index: number) => void,
  ): Promise<GitBranch[]> {
    try {
      // Only 'heads' branches can be the current branch. Checking out a trashed or remote branch will detach HEAD.
      const currentBranch =
        branchType === 'heads' ? await this.getCurrentBranch() : ''
      const namespace = this.NAMESPACES[branchType].full
      const excludePatterns = this.excludedBranches.map(
        branch => `--exclude=${namespace}/${branch}`,
      )

      const format = [
        '%(refname)',
        '%(refname:lstrip=2)', // Clean branch name without refs/namespace/
        '%(committerdate:iso)',
        '%(subject)',
        '%(objectname)', // Full hash for merge checking
        '%(authorname)',
      ].join('%09')

      const rawResult = await this.git.raw([
        'for-each-ref',
        `--format=${format}`,
        '--omit-empty',
        '--sort=-committerdate',
        ...excludePatterns,
        namespace,
      ])

      if (!rawResult.trim()) return []

      const lines = rawResult.trim().split('\n')
      const mergedHashes = new Set(await this.getMergedHashes(namespace))

      const branches: GitBranch[] = []
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Skip empty lines that can occur from trailing newlines in git output.
        // The --omit-empty flag handles empty format fields, but not empty lines from string splitting.
        if (!line) continue
        const [refname, shortname, dateStr, subject, hash, author] =
          line.split('\t')

        const date = new Date(dateStr)
        const staleDays = differenceInDays(new Date(), date)

        const branch: GitBranch = {
          name:
            branchType === 'remotes'
              ? shortname.replace('origin/', '')
              : shortname,
          ref: refname,
          isCurrent: shortname === currentBranch,
          isLocal: branchType === 'heads' || branchType === 'trash',
          isRemote: branchType === 'remotes',
          lastCommitDate: date,
          lastCommitMessage: subject || '',
          lastCommitHash: hash || '',
          lastCommitAuthor: author || '',
          isMerged: mergedHashes.has(hash),
          isStale: staleDays > this.staleDaysThreshold,
          staleDays,
          aheadBy: undefined,
          behindBy: undefined,
        }

        branches.push(branch)

        // Optional callback to e.g. stream UI for immediate UI feedback
        onUpdate?.(branch, branches.length - 1)
      }

      return branches
    } catch (error) {
      logger.error('Error getting branches', {
        branchType,
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  /**
   * Removes expired branches from trash
   */
  async cleanupTrash(): Promise<void> {
    const branches = await this.getTrashBranches()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.trashTtlDays)

    const { expiredRefs, expiredBranchNames } = await branches.reduce(
      async (accumPromise, branchName) => {
        const collections = await accumPromise

        try {
          const trashRef = this.buildFullRef(branchName, 'trash')
          const deletionDateStr = await this.getTrashDeletionDate(trashRef)

          if (!deletionDateStr) {
            logger.warn('We could not find a deletion date for this branch', {
              branchName,
            })
            return collections
          }

          const deletionDate = new Date(deletionDateStr)

          // Bail early if branch is not expired
          if (deletionDate >= cutoffDate) return collections

          collections.expiredRefs.push(trashRef)
          collections.expiredBranchNames.push(branchName)
        } catch (error) {
          logger.error('Could not check deletion date for branch', {
            branchName,
            error: error instanceof Error ? error.message : String(error),
          })
        }

        return collections
      },
      Promise.resolve({
        expiredRefs: [] as string[],
        expiredBranchNames: [] as string[],
      }),
    )

    if (expiredRefs.length === 0) return

    // Build single batch operation for both branch refs and notes
    const deleteCommands = expiredRefs
      .map(ref => ({ action: 'delete' as const, ref }))
      .concat(
        expiredBranchNames.map(branchName => ({
          action: 'delete' as const,
          ref: `refs/notes/rake-trash-dates/${branchName}`,
        })),
      )

    const result = await this.executeBatchRefUpdates(deleteCommands)

    if (!result.success) {
      logger.error('Failed to delete expired trash refs and notes', {
        expiredCount: expiredRefs.length,
        error: result.error,
      })
      throw new Error(`Trash cleanup failed: ${result.error}`)
    }
  }

  private async getTrashDeletionDate(trashRef: string): Promise<string | null> {
    const branchName = trashRef.slice(this.NAMESPACES.trash.fullLength)
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

  /**
   * Executes multiple git ref updates atomically using `git update-ref --stdin`.
   *
   * Atomicity: All transactions succeed together or all fail together.
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
  ): Promise<{ success: boolean; conflictingRefs: string[]; error?: string }> {
    if (commands.length === 0) return { success: true, conflictingRefs: [] }

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

    // We have to use spawn because simple-git doesn't support stdin piping for batch operations.
    // We need precise control over stdin formatting and stream closure for `git update-ref --stdin`.
    return new Promise(resolve => {
      const gitProcess = spawn('git', ['update-ref', '--stdin'], {
        cwd: this.workingDir,
      })

      let stderr = ''

      gitProcess.stderr.on('data', data => {
        stderr += data.toString()
      })

      gitProcess.on('close', code => {
        if (code === 0) {
          resolve({ success: true, conflictingRefs: [] })
          return
        }

        const conflictingRefs = this.parseConflictingRefs(stderr)
        resolve({
          success: false,
          conflictingRefs,
          error: stderr,
        })
      })

      gitProcess.on('error', error => {
        resolve({ success: false, conflictingRefs: [], error: error.message })
      })

      gitProcess.stdin.write(stdin)
      gitProcess.stdin.end()
    })
  }

  private parseConflictingRefs(stderr: string): string[] {
    const conflictingRefs: string[] = []
    // Git error format: "fatal: cannot lock ref 'refs/rake-trash/branch': reference already exists"
    const regex = /fatal: cannot lock ref '([^']+)': .*already exists/g
    let match
    while ((match = regex.exec(stderr)) !== null) {
      conflictingRefs.push(match[1])
    }
    return conflictingRefs
  }

  /**
   * Strips the {N} increment suffix from a branch name
   *
   * E.g., "feature/foo{2}" -> "feature/foo"
   */
  private stripIncrement(branchName: string): string {
    return branchName.replace(/\{\d+\}$/, '')
  }

  /**
   * Builds a ref name with an increment suffix
   *
   * E.g., buildIncrementedRef("feature/foo", 2) -> "feature/foo{2}"
   */
  private buildIncrementedRef(baseRef: string, increment: number): string {
    return increment === 0 ? baseRef : `${baseRef}{${increment}}`
  }

  /**
   * Creates git commands for moving branches to trash
   */
  private createTrashCommands(operations: RefOperation[]) {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    return operations.flatMap(({ name: branchName, sha }) => [
      {
        action: 'create' as const,
        ref: this.buildFullRef(branchName, 'trash'),
        value: sha,
      },
      {
        action: 'delete' as const,
        ref: this.buildFullRef(branchName, 'heads'),
      },
      {
        action: 'create' as const,
        ref: `refs/notes/rake-trash-dates/${branchName}`,
        value: today,
      },
    ])
  }

  /**
   * Creates git commands for restoring branches from trash
   */
  private createRestoreCommands(operations: RefOperation[]) {
    return operations.flatMap(({ name: branchName, sha }) => {
      const trashRef = this.buildFullRef(branchName, 'trash')
      const commands = [
        {
          action: 'create' as const,
          ref: this.buildFullRef(branchName, 'heads'),
          value: sha,
        },
        { action: 'delete' as const, ref: trashRef },
        {
          action: 'delete' as const,
          ref: `refs/notes/rake-trash-dates/${branchName}`,
        },
      ]

      return commands
    })
  }

  private async trashBranchesWithRetry(
    operations: RefOperation[],
  ): Promise<void> {
    if (operations.length === 0) return

    // Try with "normal branch names" first
    let result = await this.executeBatchRefUpdates(
      this.createTrashCommands(operations),
    )

    if (result.success) return

    // Throw immediately if we had errors, but none of them are branch name conflicts
    if (result.conflictingRefs.length === 0) {
      throw new Error(`Trash operation failed: ${result.error}`)
    }

    // Resolve conflicts and retry
    const updatedOperations = await this.resolveNameConflicts(
      result.conflictingRefs,
      operations,
      this.NAMESPACES.trash.full,
    )

    result = await this.executeBatchRefUpdates(
      this.createTrashCommands(updatedOperations),
    )

    if (!result.success) {
      throw new Error(`Conflict resolution failed: ${result.error}`)
    }
  }

  private async restoreBranchesWithRetry(
    operations: RefOperation[],
  ): Promise<void> {
    if (operations.length === 0) return

    // Try with "normal branch names" first
    let result = await this.executeBatchRefUpdates(
      this.createRestoreCommands(operations),
    )

    if (result.success) return

    // Throw immediately if we had errors, but none of them are branch name conflicts
    if (result.conflictingRefs.length === 0) {
      throw new Error(`Restore operation failed: ${result.error}`)
    }

    // Resolve conflicts and retry
    const updatedOperations = await this.resolveNameConflicts(
      result.conflictingRefs,
      operations,
      this.NAMESPACES.heads.full,
    )

    result = await this.executeBatchRefUpdates(
      this.createRestoreCommands(updatedOperations),
    )

    if (!result.success) {
      throw new Error(`Conflict resolution failed: ${result.error}`)
    }
  }

  /**
   * Resolves naming conflicts by finding available incremented names
   */
  private async resolveNameConflicts(
    conflictingRefs: string[],
    operations: RefOperation[],
    targetNamespace: string,
  ): Promise<RefOperation[]> {
    if (conflictingRefs.length === 0) {
      return operations
    }

    // Build conflict resolutions map
    const conflictResolutions = new Map<string, string>()
    const existingRefs = await this.getAllRefsInNamespace(targetNamespace)

    for (const conflictingRef of conflictingRefs) {
      const branchName = conflictingRef.slice(targetNamespace.length)
      const baseBranchName = this.stripIncrement(branchName)
      const increment = this.findNextAvailableIncrementFromRefs(
        baseBranchName,
        existingRefs,
      )
      const incrementedBranchName = this.buildIncrementedRef(
        baseBranchName,
        increment,
      )

      logger.info(
        `Resolving naming conflict. Original: '${branchName}', Final: '${incrementedBranchName}'`,
      )
      conflictResolutions.set(branchName, incrementedBranchName)
    }

    // Return operations with resolved names so the operations can be retried
    return operations.map(op => ({
      ...op,
      name: conflictResolutions.get(op.name) || op.name,
    }))
  }

  /**
   * Gets all refs in a namespace with a single git call for better performance
   */
  private async getAllRefsInNamespace(namespace: string): Promise<string[]> {
    try {
      const refs = await this.git.raw([
        'for-each-ref',
        '--format=%(refname:lstrip=2)', // Clean branch names without refs/namespace/
        namespace,
      ])

      if (!refs.trim()) return []

      return refs.trim().split('\n').filter(Boolean)
    } catch (error) {
      logger.error('Error getting refs in namespace', {
        namespace,
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  /**
   * Create branch operations for multiple branches
   */
  private async getBranchOperations(
    branchNames: string[],
    namespace: keyof typeof this.NAMESPACES,
  ): Promise<RefOperation[]> {
    if (branchNames.length === 0) return []

    try {
      const result = await this.git.raw([
        'for-each-ref',
        '--format=%(refname:lstrip=2) %(objectname)',
        this.NAMESPACES[namespace].full,
      ])

      if (!result.trim()) return []

      const requestedBranches = new Set(branchNames)
      const operations: RefOperation[] = []

      for (const line of result.trim().split('\n')) {
        const [branchName, sha] = line.split(' ')
        if (branchName && sha && requestedBranches.has(branchName)) {
          operations.push({ name: branchName, sha })
        }
      }

      return operations
    } catch (error) {
      logger.error('Error fetching branch operations', {
        branchCount: branchNames.length,
        namespace: this.NAMESPACES[namespace].full,
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  /**
   * Finds the next available increment from a pre-fetched list of refs
   */
  private findNextAvailableIncrementFromRefs(
    baseBranchName: string,
    allRefs: string[],
  ): number {
    // Find refs that match our base name with {N} pattern
    const escapedBaseBranchName = baseBranchName.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    )
    const incrementPattern = new RegExp(
      `^${escapedBaseBranchName}(\\{(\\d+)\\})?$`,
    )

    let maxIncrement = 0
    let baseExists = false

    for (const branchName of allRefs) {
      const match = branchName.match(incrementPattern)
      if (match) {
        if (match[2]) {
          const increment = parseInt(match[2], 10)
          maxIncrement = Math.max(maxIncrement, increment)
        } else {
          baseExists = true
        }
      }
    }

    // If base doesn't exist, we can use it (increment 0)
    // Otherwise, use next available increment
    return baseExists ? maxIncrement + 1 : 0
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
