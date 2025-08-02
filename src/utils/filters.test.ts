import { filterBranches, getFilterOptionsForType } from './filters'
import type { GitBranch } from '../services/GitRepository.types.js'

const mockBranch = (overrides: Partial<GitBranch> = {}): GitBranch => ({
  name: 'test-branch',
  ref: 'refs/heads/test-branch',
  isCurrent: false,
  isRemote: false,
  lastCommitDate: new Date(),
  lastCommitMessage: 'Test commit',
  lastCommitHash: 'abc123',
  lastCommitAuthor: 'Test Author',
  isMerged: false,
  isStale: false,
  staleDays: 0,
  upstreamBranch: null,
  upstreamTrack: null,
  upstreamTrackShort: null,
  ...overrides,
})

describe('filters', () => {
  describe('getFilterOptionsForType', () => {
    it('should return correct options for "all" filter', () => {
      const options = getFilterOptionsForType('all')
      expect(options).toEqual({
        showMerged: true,
        showUnmerged: true,
        showStale: true,
        showLocal: true,
        showRemote: false,
      })
    })

    it('should return correct options for "merged" filter', () => {
      const options = getFilterOptionsForType('merged')
      expect(options).toEqual({
        showMerged: true,
        showUnmerged: false,
        showStale: true,
        showLocal: true,
        showRemote: false,
      })
    })
  })

  describe('filterBranches', () => {
    it('should filter merged branches correctly', () => {
      const branches = [
        mockBranch({ name: 'merged', isMerged: true }),
        mockBranch({ name: 'unmerged', isMerged: false }),
      ]

      const options = {
        showMerged: true,
        showUnmerged: false,
        showStale: true,
        showLocal: true,
        showRemote: false,
      }
      const result = filterBranches(branches, options)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('merged')
    })

    it('should filter local vs remote branches', () => {
      const branches = [
        mockBranch({ name: 'local', isRemote: false }),
        mockBranch({ name: 'remote', isRemote: true }),
      ]

      const options = {
        showMerged: true,
        showUnmerged: true,
        showStale: true,
        showLocal: true,
        showRemote: false,
      }
      const result = filterBranches(branches, options)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('local')
    })
  })
})
