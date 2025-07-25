import { useState, useEffect, useCallback } from 'react'
import { GitRepository } from '@services/GitRepository.js'
import type { GitBranch } from '@services/GitRepository.types.js'
import { GitRakeConfig } from '@utils/config.js'

type UseRepositoryLoaderProps = {
  gitRepo: GitRepository
  config: GitRakeConfig
  includeRemote?: boolean
  restoreMode?: boolean
  currentPath: string
}

type UseRepositoryLoaderReturn = {
  branches: GitBranch[]
  loading: boolean
  error: string
  loadBranches: () => Promise<void>
}

export function useRepositoryLoader({
  gitRepo,
  config,
  includeRemote = false,
  restoreMode = false,
  currentPath,
}: UseRepositoryLoaderProps): UseRepositoryLoaderReturn {
  const [branches, setBranches] = useState<GitBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      if (!(await gitRepo.isGitRepository())) {
        setError(`Not a git repository: ${currentPath}`)
        return
      }

      let branchList: GitBranch[]
      if (restoreMode) {
        const trashBranches = await gitRepo.getTrashBranches()
        branchList = trashBranches.map((name: string) => ({
          name,
          ref: `refs/rake-trash/${name}`,
          isCurrent: false,
          isLocal: true,
          isRemote: false,
          lastCommitDate: new Date(),
          lastCommitMessage: 'Deleted branch',
          lastCommitHash: '',
          isMerged: false,
          isStale: true,
        }))
      } else {
        branchList = await gitRepo.getAllBranches(
          includeRemote || config.includeRemote,
        )
      }

      setBranches(branchList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [gitRepo, config, includeRemote, restoreMode, currentPath])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  return {
    branches,
    loading,
    error,
    loadBranches,
  }
}
