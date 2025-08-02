import { useState, useEffect, useCallback } from 'react'
import { GitRepository } from '@services/GitRepository.js'
import type { GitBranch } from '@services/GitRepository.types.js'
import type { GitRakeConfig } from '@utils/config.types.js'

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

      let branches: GitBranch[] = []

      if (restoreMode) {
        branches = await gitRepo.getBranches('trash', (branch, index) => {
          setBranches(prev => [
            ...prev.slice(0, index),
            branch,
            ...prev.slice(index + 1),
          ])
        })
      } else {
        const localBranches = await gitRepo.getBranches(
          'heads',
          (branch, index) => {
            setBranches(prev => [
              ...prev.slice(0, index),
              branch,
              ...prev.slice(index + 1),
            ])
          },
        )

        branches = [...localBranches]

        if (includeRemote || config.includeRemote) {
          const remoteBranches = await gitRepo.getBranches(
            'remotes',
            (branch, index) => {
              const newIndex = localBranches.length + index
              setBranches(prev => [
                ...prev.slice(0, newIndex),
                branch,
                ...prev.slice(newIndex + 1),
              ])
            },
          )
          branches = [...localBranches, ...remoteBranches]
        }
      }

      setBranches(branches)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
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
