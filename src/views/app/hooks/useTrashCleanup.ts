import { useCallback } from 'react'
import type { GitRepository } from '@services/GitRepository.js'
import type { GitRakeConfig } from '@utils/config.types.js'
import { logger } from '@utils/logger.js'

type UseTrashCleanupProps = {
  gitRepo: GitRepository
  config: GitRakeConfig
}

export function useTrashCleanup({
  gitRepo,
  config,
}: UseTrashCleanupProps): () => Promise<void> {
  return useCallback(async () => {
    if (!config.autoCleanupTrash) {
      return
    }

    try {
      await gitRepo.cleanupTrash()
    } catch (error) {
      logger.error('Background trash cleanup failed after app load', {
        autoCleanupEnabled: config.autoCleanupTrash,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }, [gitRepo, config.autoCleanupTrash])
}
