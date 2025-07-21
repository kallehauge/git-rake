import { cosmiconfigSync } from 'cosmiconfig'
import { GitConfig } from '@services/GitRepository.js'
import { homedir } from 'os'

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
 * Load configuration
 *
 * This will load configuration in the following order, and override the
 * values with the ones from the next source if there are duplicates:
 *   1. Default config (defined in this file)
 *   2. User config (in the user's home directory)
 *   3. Project config (in the project directory)
 */
export function loadConfig(): GitRakeConfig {
  let userConfig: Partial<GitRakeConfig> = {}
  const homeDir = homedir()

  const userExplorer = cosmiconfigSync('gitrake', {
    stopDir: homeDir,
  })

  const userResult = userExplorer.search(homeDir)
  if (userResult && !userResult.isEmpty) {
    userConfig = userResult.config
  }

  const projectExplorer = cosmiconfigSync('gitrake')
  const projectResult = projectExplorer.search()
  const projectConfig = projectResult ? projectResult.config : {}

  return { ...defaultConfig, ...userConfig, ...projectConfig }
}
