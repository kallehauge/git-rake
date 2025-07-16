import { filterBranches, getFilterOptionsForType, sortBranches } from './filters';
import { GitBranch } from '@types';

const mockBranch = (overrides: Partial<GitBranch> = {}): GitBranch => ({
  name: 'test-branch',
  ref: 'refs/heads/test-branch',
  isCurrent: false,
  isLocal: true,
  isRemote: false,
  lastCommitDate: new Date(),
  lastCommitMessage: 'Test commit',
  lastCommitHash: 'abc123',
  isMerged: false,
  isStale: false,
  ...overrides,
});

describe('filters', () => {
  describe('getFilterOptionsForType', () => {
    it('should return correct options for "all" filter', () => {
      const options = getFilterOptionsForType('all');
      expect(options).toEqual({
        showMerged: true,
        showUnmerged: true,
        showStale: true,
        showLocal: true,
        showRemote: false,
      });
    });

    it('should return correct options for "merged" filter', () => {
      const options = getFilterOptionsForType('merged');
      expect(options).toEqual({
        showMerged: true,
        showUnmerged: false,
        showStale: true,
        showLocal: true,
        showRemote: false,
      });
    });
  });

  describe('filterBranches', () => {
    it('should filter merged branches correctly', () => {
      const branches = [
        mockBranch({ name: 'merged', isMerged: true }),
        mockBranch({ name: 'unmerged', isMerged: false }),
      ];

      const options = { showMerged: true, showUnmerged: false, showStale: true, showLocal: true, showRemote: false };
      const result = filterBranches(branches, options);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('merged');
    });

    it('should filter local vs remote branches', () => {
      const branches = [
        mockBranch({ name: 'local', isLocal: true, isRemote: false }),
        mockBranch({ name: 'remote', isLocal: false, isRemote: true }),
      ];

      const options = { showMerged: true, showUnmerged: true, showStale: true, showLocal: true, showRemote: false };
      const result = filterBranches(branches, options);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('local');
    });
  });

  describe('sortBranches', () => {
    it('should sort current branch first', () => {
      const branches = [
        mockBranch({ name: 'feature', isCurrent: false, lastCommitDate: new Date('2023-01-02') }),
        mockBranch({ name: 'main', isCurrent: true, lastCommitDate: new Date('2023-01-01') }),
      ];

      const result = sortBranches(branches);

      expect(result[0].name).toBe('main');
      expect(result[1].name).toBe('feature');
    });

    it('should sort by last commit date after current branch', () => {
      const branches = [
        mockBranch({ name: 'old', lastCommitDate: new Date('2023-01-01') }),
        mockBranch({ name: 'new', lastCommitDate: new Date('2023-01-02') }),
      ];

      const result = sortBranches(branches);

      expect(result[0].name).toBe('new');
      expect(result[1].name).toBe('old');
    });
  });
});
