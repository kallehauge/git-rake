import { simpleGit, SimpleGit } from 'simple-git'
import { differenceInDays } from 'date-fns/differenceInDays'
import { spawn } from 'child_process'
import { logger } from '@utils/logger.js'
import type {
  GitBranch,
  GitTrashBranch,
  GitConfig,
  GitBranchOperation,
  RefOperation,
} from './GitRepository.types.js'

export class GitRepository {
  private git: SimpleGit
  private readonly NAMESPACES = {
    heads: 'refs/heads/',
    trash: 'refs/rake-trash/',
    remotes: 'refs/remotes/',
  } as const
  private mergeCompareBranch: string
  private workingDir: string
  private trashTtlDays: number
  private staleDaysThreshold: number
  private excludedBranches: string[]

  constructor(config: GitConfig, workingDir?: string) {
    this.workingDir = workingDir || process.cwd()
    this.git = simpleGit(this.workingDir)
    this.mergeCompareBranch = config.mergeCompareBranch
    this.trashTtlDays = config.trashTtlDays
    this.staleDaysThreshold = config.staleDaysThreshold
    this.excludedBranches = config.excludedBranches
    // This app assumes that the "mergeCompareBranch" exists locally, so we do not want to
    // include it in any accedental bulk operations aka we exclude it by default.
    this.excludedBranches.push(this.mergeCompareBranch)
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
    return this.NAMESPACES[namespaceKey] + branchName
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
    const targetFull = this.NAMESPACES[targetNamespaceKey]
    const targetShort = targetFull.slice(5) // Remove 'refs/' prefix to get short form

    // Try full ref
    if (input.startsWith(targetFull)) {
      return input.slice(targetFull.length)
    }

    // Try short ref
    if (input.startsWith(targetShort)) {
      return input.slice(targetShort.length)
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
        '--merged=' + this.mergeCompareBranch,
        '--format=%(objectname)',
        '--omit-empty',
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
   * Get branches, with optional streaming callback
   */
  async getBranches<T extends 'heads' | 'trash' | 'remotes'>(
    branchType: T,
    onUpdate?: T extends 'trash'
      ? (branch: GitTrashBranch, index: number) => void
      : (branch: GitBranch, index: number) => void,
  ): Promise<T extends 'trash' ? GitTrashBranch[] : GitBranch[]> {
    try {
      // Only 'heads' branches can be the current branch. Checking out a trashed or remote branch will detach HEAD.
      const currentBranch =
        branchType === 'heads' ? await this.getCurrentBranch() : ''
      const namespace = this.NAMESPACES[branchType]
      const excludePatterns = this.excludedBranches.map(
        branch => `--exclude=${namespace}${branch}`,
      )

      const format = [
        '%(refname)',
        '%(refname:lstrip=2)', // Clean branch name without refs/namespace/
        '%(committerdate:iso)',
        '%(subject)',
        '%(objectname)', // Full hash for merge checking
        '%(authorname)',
        '%(upstream:short)',
        '%(upstream:track)',
        '%(upstream:trackshort)',
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

      const branches = []
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Skip empty lines that can occur from trailing newlines in git output.
        // The --omit-empty flag handles empty format fields, but not empty lines from string splitting.
        if (!line) continue
        const [
          refname,
          shortname,
          dateStr,
          subject,
          hash,
          author,
          upstreamShort,
          upstreamTrack,
          upstreamTrackShort,
        ] = line.split('\t')

        const date = new Date(dateStr)
        const staleDays = differenceInDays(new Date(), date)

        const baseBranch = {
          ref: refname,
          lastCommitDate: date,
          lastCommitMessage: subject,
          lastCommitHash: hash,
          lastCommitAuthor: author,
          isMerged: mergedHashes.has(hash),
          isStale: staleDays > this.staleDaysThreshold,
          staleDays,
          isCurrent: shortname === currentBranch,
          isRemote: branchType === 'remotes',
          upstreamBranch: upstreamShort || null,
          upstreamTrack: upstreamTrack || null,
          upstreamTrackShort: upstreamTrackShort || null,
        }

        if (branchType === 'trash') {
          const parsed = this.parseTrashRefName(shortname)
          const branch = {
            ...baseBranch,
            name: parsed.branchName,
            deletionDate: new Date(parsed.date),
          } satisfies GitTrashBranch

          branches.push(branch)

          // Optional callback to e.g. stream UI for immediate UI feedback
          ;(onUpdate as (branch: GitTrashBranch, index: number) => void)?.(
            branch,
            branches.length - 1,
          )
        } else {
          const branch = {
            ...baseBranch,
            name:
              branchType === 'remotes'
                ? shortname.replace('origin/', '')
                : shortname,
          } satisfies GitBranch

          branches.push(branch)

          // Optional callback to e.g. stream UI for immediate UI feedback
          ;(onUpdate as (branch: GitBranch, index: number) => void)?.(
            branch,
            branches.length - 1,
          )
        }
      }

      return branches as T extends 'trash' ? GitTrashBranch[] : GitBranch[]
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
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.trashTtlDays)

    try {
      const trashBranches = await this.getBranches('trash')

      const expiredOperations = trashBranches.reduce<
        Array<{ action: 'delete'; ref: string }>
      >((operations, branch) => {
        if (branch.deletionDate < cutoffDate) {
          operations.push({ action: 'delete' as const, ref: branch.ref })
        }
        return operations
      }, [])

      if (expiredOperations.length === 0) return

      const result = await this.executeBatchRefUpdates(expiredOperations)

      if (!result.success) {
        logger.error('Failed to delete expired trash refs', {
          expiredCount: expiredOperations.length,
          error: result.error,
        })
        throw new Error(`Trash cleanup failed: ${result.error}`)
      }
    } catch (error) {
      logger.error('Failed to cleanup trash', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
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
   * Parses a date-embedded trash ref name into branch name and date.
   *
   * Format: "branch-name@YYYY-MM-DD"
   * Uses @ separator to avoid conflicts with branch names that may contain colons.
   */
  private parseTrashRefName(refName: string): {
    branchName: string
    date: string
  } {
    const lastAt = refName.lastIndexOf('@')
    if (lastAt === -1) {
      throw new Error(`Invalid trash ref format - missing date: ${refName}`)
    }

    const branchName = refName.substring(0, lastAt)
    const date = refName.substring(lastAt + 1)

    if (!branchName) {
      throw new Error(
        `Invalid trash ref format - empty branch name: ${refName}`,
      )
    }

    // Validate date format with regex first for performance and exact format matching.
    // The Date constructor is too permissive - it accepts "2023/12/25", "Dec 25, 2023", etc.
    // Regex ensures we only accept YYYY-MM-DD format and fails fast on invalid strings.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(
        `Invalid trash ref format - bad date format: ${refName} (expected YYYY-MM-DD)`,
      )
    }

    // Validate it's actually a valid date after passing format check.
    // This catches edge cases like "2023-13-01" (month overflow) or "2023-02-30" (invalid day).
    // Date constructor silently "corrects" these instead of failing, so we verify the round-trip.
    const dateObj = new Date(date)
    if (
      isNaN(dateObj.getTime()) ||
      dateObj.toISOString().split('T')[0] !== date
    ) {
      throw new Error(
        `Invalid trash ref format - invalid date: ${refName} (${date} is not a valid date)`,
      )
    }

    return { branchName, date }
  }

  /**
   * Builds a trash ref name with embedded date.
   *
   * Performance: Date is embedded directly in ref name, eliminating need for separate notes refs.
   */
  private buildTrashRefName(branchName: string): string {
    const today = new Date().toISOString().split('T')[0]
    return `${branchName}@${today}`
  }

  /**
   * Creates git commands for moving branches to trash
   */
  private createTrashCommands(operations: RefOperation[]) {
    return operations.flatMap(({ name: branchName, sha }) => [
      {
        action: 'create' as const,
        ref: this.buildFullRef(this.buildTrashRefName(branchName), 'trash'),
        value: sha,
      },
      {
        action: 'delete' as const,
        ref: this.buildFullRef(branchName, 'heads'),
      },
    ])
  }

  /**
   * Creates git commands for restoring branches from trash
   */
  private createRestoreCommands(operations: RefOperation[]) {
    return operations.flatMap(({ name: decoratedName, sha }) => {
      const branchName = this.parseTrashRefName(decoratedName).branchName

      return [
        {
          action: 'create' as const,
          ref: this.buildFullRef(branchName, 'heads'),
          value: sha,
        },
        {
          action: 'delete' as const,
          ref: this.buildFullRef(decoratedName, 'trash'),
        },
      ]
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
      this.NAMESPACES.trash,
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
      this.NAMESPACES.heads,
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
        '--omit-empty',
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
        '--omit-empty',
        this.NAMESPACES[namespace],
      ])

      if (!result.trim()) return []

      const requestedBranches = new Set(branchNames)
      const operations: RefOperation[] = []
      const foundBranches = new Set<string>()

      for (const line of result.trim().split('\n')) {
        const [refName, sha] = line.split(' ')
        if (!refName || !sha) continue

        let branchName: string

        if (namespace === 'trash') {
          branchName = this.parseTrashRefName(refName).branchName
        } else {
          branchName = refName
        }

        if (requestedBranches.has(branchName)) {
          operations.push({ name: refName, sha })
          foundBranches.add(branchName)
        }
      }

      if (foundBranches.size !== branchNames.length) {
        const missing = branchNames.filter(name => !foundBranches.has(name))
        throw new Error(
          `Branches not found in ${namespace}: ${missing.join(', ')}`,
        )
      }

      return operations
    } catch (error) {
      logger.error('Error fetching branch operations', {
        branchCount: branchNames.length,
        namespace: this.NAMESPACES[namespace],
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Finds the next available increment from a pre-fetched list of refs
   */
  private findNextAvailableIncrementFromRefs(
    conflictingBranchName: string,
    allRefs: string[],
  ): number {
    const baseBranchName = this.stripIncrement(conflictingBranchName)

    let highestIncrement = 0
    for (const refName of allRefs) {
      // Check for increment pattern: "base-name{123}"
      if (refName.startsWith(baseBranchName + '{') && refName.endsWith('}')) {
        const incrementPart = refName.slice(baseBranchName.length + 1, -1)
        const increment = parseInt(incrementPart, 10)

        if (!isNaN(increment)) {
          highestIncrement = Math.max(highestIncrement, increment)
        }
      }
    }

    return highestIncrement + 1
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
