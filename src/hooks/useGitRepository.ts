import { useMemo } from 'react';
import { GitRepository } from '../services/GitRepository.js';
import { ConfigLoader } from '../utils/config.js';

interface UseGitRepositoryProps {
  workingDir?: string;
}

interface UseGitRepositoryReturn {
  gitRepo: GitRepository;
  config: any;
  theme: any;
  currentPath: string;
}

export function useGitRepository({ workingDir }: UseGitRepositoryProps = {}): UseGitRepositoryReturn {
  const gitRepo = useMemo(() => new GitRepository(workingDir), [workingDir]);

  const config = useMemo(() => new ConfigLoader().loadConfig(), []);

  const theme = useMemo(() => new ConfigLoader().getTheme(config.theme), [config.theme]);

  const currentPath = useMemo(() => workingDir || process.cwd(), [workingDir]);

  return {
    gitRepo,
    config,
    theme,
    currentPath,
  };
}
