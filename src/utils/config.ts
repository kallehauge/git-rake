import { cosmiconfigSync } from 'cosmiconfig'
import { GitConfig } from '@services/GitRepository.js'
import { homedir } from 'os'
import { simpleGit } from 'simple-git'

export interface GitRakeConfig extends GitConfig {
  theme: string
  includeRemote: boolean
  autoCleanupTrash: boolean
  excludedBranches: string[]
}

const defaultConfig: GitRakeConfig = {
  staleDaysThreshold: 30,
  trashNamespace: 'refs/rake-trash',
  trashTtlDays: 90,
  mainBranch: 'main',
  theme: 'auto',
  includeRemote: false,
  autoCleanupTrash: true,
  excludedBranches: [
    'main',
    'master',
    'trunk',
    'develop',
    'dev',
    'release',
    'production',
    'prod',
    'staging',
  ],
}

/**
 * Find git repository root from a given working directory
 */
async function findGitRootAsync(workingDir?: string): Promise<string | null> {
  try {
    const git = simpleGit(workingDir || process.cwd())
    const rootPath = await git.revparse(['--show-toplevel'])
    return rootPath.trim()
  } catch {
    return null
  }
}

/**
 * Load configuration
 *
 * This will load configuration in the following order, and override the
 * values with the ones from the next source if there are duplicates:
 *   1. Default config (defined in this file)
 *   2. User config (only from the user's home directory, e.g.: ~/.gitrakerc)
 *   3. Project config (only from git repository root)
 */
export async function loadConfigAsync(
  workingDir?: string,
): Promise<GitRakeConfig> {
  const gitRoot = await findGitRootAsync(workingDir).then(
    (root: string | null) => {
      return root || process.cwd()
    },
  )

  let userConfig: Partial<GitRakeConfig> = {}
  let projectConfig: Partial<GitRakeConfig> = {}

  const homeDir = homedir()
  const userExplorer = cosmiconfigSync('gitrake', {
    stopDir: homeDir,
  })

  try {
    const userResult = userExplorer.search(homeDir)
    if (userResult && !userResult.isEmpty) {
      userConfig = userResult.config
    }
  } catch {
    // No user config found, use empty object
  }

  if (gitRoot) {
    const projectExplorer = cosmiconfigSync('gitrake', {
      stopDir: gitRoot,
    })
    try {
      const projectResult = projectExplorer.search(gitRoot)
      if (projectResult && !projectResult.isEmpty) {
        projectConfig = projectResult.config
      }
    } catch {
      // No project config found, use empty object
    }
  }

  return { ...defaultConfig, ...userConfig, ...projectConfig }
}
