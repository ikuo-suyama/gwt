import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorktreeManager } from '../../src/lib/worktree';
import { GitService } from '../../src/lib/git';

// Mock GitService
vi.mock('../../src/lib/git');

// Mock logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    step: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('WorktreeManager', () => {
  let worktreeManager: WorktreeManager;
  let mockGitService: GitService;

  beforeEach(() => {
    mockGitService = new GitService({ cwd: '/test/path' });
    worktreeManager = new WorktreeManager(mockGitService);
    vi.clearAllMocks();
  });

  describe('generateSafeName', () => {
    it('should replace forward slashes with hyphens', () => {
      const result = worktreeManager.generateSafeName('feature/my-branch');
      expect(result).toBe('feature-my-branch');
    });

    it('should handle multiple slashes', () => {
      const result = worktreeManager.generateSafeName('feature/sub/branch');
      expect(result).toBe('feature-sub-branch');
    });

    it('should handle branch names without slashes', () => {
      const result = worktreeManager.generateSafeName('main');
      expect(result).toBe('main');
    });
  });

  describe('computeWorktreePath', () => {
    it('should return custom path when provided', () => {
      const customPath = '/custom/path';
      const result = worktreeManager.computeWorktreePath('feature/test', customPath);
      expect(result).toContain('custom');
      expect(result).toContain('path');
    });

    it('should generate path based on current directory and branch', () => {
      const branchName = 'feature/test';
      const result = worktreeManager.computeWorktreePath(branchName);
      expect(result).toContain('feature-test');
    });
  });

  describe('createWorktree', () => {
    beforeEach(() => {
      vi.spyOn(mockGitService, 'branchExists').mockResolvedValue(true);
      vi.spyOn(mockGitService, 'createWorktree').mockResolvedValue();
      vi.spyOn(mockGitService, 'rebaseToBase').mockResolvedValue();
      vi.spyOn(mockGitService, 'getBaseBranch').mockResolvedValue('develop');
    });

    it('should create worktree with existing branch', async () => {
      const options = {
        branchName: 'feature/test',
        autoRebase: false,
        copyEnv: false,
      };

      const result = await worktreeManager.createWorktree(options);
      expect(result).toBeDefined();
      expect(mockGitService.branchExists).toHaveBeenCalledWith('feature/test');
      expect(mockGitService.createWorktree).toHaveBeenCalledWith(
        expect.any(String),
        'feature/test',
        false,
        undefined
      );
    });

    it('should create worktree with new branch', async () => {
      vi.spyOn(mockGitService, 'branchExists').mockResolvedValue(false);

      const options = {
        branchName: 'feature/new',
        autoRebase: false,
        copyEnv: false,
      };

      await worktreeManager.createWorktree(options);
      expect(mockGitService.createWorktree).toHaveBeenCalledWith(
        expect.any(String),
        'feature/new',
        true,
        'origin/develop'
      );
    });

    it('should use current branch when branchName is not provided', async () => {
      vi.spyOn(mockGitService, 'getCurrentBranch').mockResolvedValue('current-branch');

      const options = {
        branchName: '',
        autoRebase: false,
        copyEnv: false,
      };

      await worktreeManager.createWorktree(options);
      expect(mockGitService.getCurrentBranch).toHaveBeenCalled();
      expect(mockGitService.branchExists).toHaveBeenCalledWith('current-branch');
    });

    it('should create worktree from HEAD when --from HEAD is specified', async () => {
      vi.spyOn(mockGitService, 'branchExists').mockResolvedValue(false);
      vi.spyOn(mockGitService, 'getCurrentBranch').mockResolvedValue('feature/base');

      const options = {
        branchName: 'feature/new',
        autoRebase: false,
        copyEnv: false,
        from: 'HEAD',
      };

      await worktreeManager.createWorktree(options);
      expect(mockGitService.getCurrentBranch).toHaveBeenCalled();
      expect(mockGitService.createWorktree).toHaveBeenCalledWith(
        expect.any(String),
        'feature/new',
        true,
        'feature/base'
      );
    });

    it('should create worktree from specified branch when --from is specified', async () => {
      vi.spyOn(mockGitService, 'branchExists').mockResolvedValue(false);

      const options = {
        branchName: 'feature/new',
        autoRebase: false,
        copyEnv: false,
        from: 'main',
      };

      await worktreeManager.createWorktree(options);
      expect(mockGitService.createWorktree).toHaveBeenCalledWith(
        expect.any(String),
        'feature/new',
        true,
        'main'
      );
    });
  });

  describe('deleteWorktree', () => {
    it('should delete worktree successfully', async () => {
      vi.spyOn(mockGitService, 'removeWorktree').mockResolvedValue();

      await worktreeManager.deleteWorktree('/path/to/worktree', false);
      expect(mockGitService.removeWorktree).toHaveBeenCalledWith('/path/to/worktree', false);
    });

    it('should delete worktree with force flag', async () => {
      vi.spyOn(mockGitService, 'removeWorktree').mockResolvedValue();

      await worktreeManager.deleteWorktree('/path/to/worktree', true);
      expect(mockGitService.removeWorktree).toHaveBeenCalledWith('/path/to/worktree', true);
    });

    it('should throw WorktreeError when deletion fails', async () => {
      vi.spyOn(mockGitService, 'removeWorktree').mockRejectedValue(new Error('Permission denied'));

      await expect(worktreeManager.deleteWorktree('/path/to/worktree')).rejects.toThrow();
    });
  });

  describe('listWorktrees', () => {
    it('should list worktrees with enhanced information', async () => {
      const mockWorktrees = [
        {
          path: '/path/to/worktree1',
          branch: 'main',
          commit: 'abc1234',
          isCurrent: true,
          isDetached: false,
          isMain: true,
          isPrunable: false,
        },
        {
          path: '/path/to/worktree2',
          branch: 'feature/test',
          commit: 'def5678',
          isCurrent: false,
          isDetached: false,
          isMain: false,
          isPrunable: false,
        },
      ];

      const date1 = new Date('2024-12-10T10:00:00Z');
      const date2 = new Date('2024-12-14T10:00:00Z'); // More recent

      vi.spyOn(mockGitService, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.spyOn(mockGitService, 'getLastCommitMessage')
        .mockResolvedValueOnce('Initial commit')
        .mockResolvedValueOnce('Add feature');
      vi.spyOn(mockGitService, 'getCommitDate')
        .mockResolvedValueOnce(date1)
        .mockResolvedValueOnce(date2);
      vi.spyOn(mockGitService, 'hasChanges')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      vi.spyOn(mockGitService, 'getRemoteSyncStatus').mockResolvedValueOnce('synced');

      const result = await worktreeManager.listWorktrees();

      expect(result).toHaveLength(2);

      // Verify sorting: more recent commit should be first
      expect(result[0].commit).toBe('def5678'); // More recent
      expect(result[1].commit).toBe('abc1234'); // Older

      // Verify enhanced information
      expect(result[0].lastCommitMessage).toBe('Add feature');
      expect(result[0].lastCommitDate).toEqual(date2);
      expect(result[0].lastCommitDateRelative).toBeDefined();
      expect(result[0].hasChanges).toBe(true);
      expect(result[0].remoteSyncStatus).toBe('synced');

      expect(result[1].lastCommitMessage).toBe('Initial commit');
      expect(result[1].lastCommitDate).toEqual(date1);
      expect(result[1].lastCommitDateRelative).toBeDefined();
      expect(result[1].hasChanges).toBe(false);
      expect(result[1].remoteSyncStatus).toBe('no-remote'); // Main branch
    });

    it('should handle errors gracefully and use fallback values', async () => {
      const mockWorktrees = [
        {
          path: '/path/to/worktree1',
          branch: 'main',
          commit: 'abc1234',
          isCurrent: true,
          isDetached: false,
          isMain: true,
          isPrunable: false,
        },
      ];

      vi.spyOn(mockGitService, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.spyOn(mockGitService, 'getLastCommitMessage').mockResolvedValue('Commit message');
      vi.spyOn(mockGitService, 'getCommitDate').mockRejectedValue(new Error('Git error'));
      vi.spyOn(mockGitService, 'hasChanges').mockRejectedValue(new Error('Git error'));

      const result = await worktreeManager.listWorktrees();

      expect(result).toHaveLength(1);
      expect(result[0].lastCommitDateRelative).toBe('unknown');
      expect(result[0].hasChanges).toBe(false);
    });

    it('should not check remote status for main worktree', async () => {
      const mockWorktrees = [
        {
          path: '/path/to/worktree1',
          branch: 'main',
          commit: 'abc1234',
          isCurrent: true,
          isDetached: false,
          isMain: true,
          isPrunable: false,
        },
      ];

      vi.spyOn(mockGitService, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.spyOn(mockGitService, 'getLastCommitMessage').mockResolvedValue('Commit');
      vi.spyOn(mockGitService, 'getCommitDate').mockResolvedValue(new Date());
      vi.spyOn(mockGitService, 'hasChanges').mockResolvedValue(false);
      const remoteSyncSpy = vi.spyOn(mockGitService, 'getRemoteSyncStatus');

      const result = await worktreeManager.listWorktrees();

      expect(result[0].remoteSyncStatus).toBe('no-remote');
      expect(remoteSyncSpy).not.toHaveBeenCalled();
    });

    it('should not check remote status for detached HEAD', async () => {
      const mockWorktrees = [
        {
          path: '/path/to/worktree1',
          branch: 'HEAD',
          commit: 'abc1234',
          isCurrent: true,
          isDetached: true,
          isMain: false,
          isPrunable: false,
        },
      ];

      vi.spyOn(mockGitService, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.spyOn(mockGitService, 'getLastCommitMessage').mockResolvedValue('Commit');
      vi.spyOn(mockGitService, 'getCommitDate').mockResolvedValue(new Date());
      vi.spyOn(mockGitService, 'hasChanges').mockResolvedValue(false);
      const remoteSyncSpy = vi.spyOn(mockGitService, 'getRemoteSyncStatus');

      const result = await worktreeManager.listWorktrees();

      expect(result[0].remoteSyncStatus).toBe('no-remote');
      expect(remoteSyncSpy).not.toHaveBeenCalled();
    });

    it('should sort worktrees by commit date descending', async () => {
      const mockWorktrees = [
        {
          path: '/path/to/old',
          branch: 'feature/old',
          commit: 'old123',
          isCurrent: false,
          isDetached: false,
          isMain: false,
          isPrunable: false,
        },
        {
          path: '/path/to/recent',
          branch: 'feature/recent',
          commit: 'rec456',
          isCurrent: false,
          isDetached: false,
          isMain: false,
          isPrunable: false,
        },
        {
          path: '/path/to/middle',
          branch: 'feature/middle',
          commit: 'mid789',
          isCurrent: false,
          isDetached: false,
          isMain: false,
          isPrunable: false,
        },
      ];

      const oldDate = new Date('2024-12-01T10:00:00Z');
      const middleDate = new Date('2024-12-10T10:00:00Z');
      const recentDate = new Date('2024-12-14T10:00:00Z');

      vi.spyOn(mockGitService, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.spyOn(mockGitService, 'getLastCommitMessage').mockResolvedValue('Commit');
      vi.spyOn(mockGitService, 'getCommitDate')
        .mockResolvedValueOnce(oldDate)
        .mockResolvedValueOnce(recentDate)
        .mockResolvedValueOnce(middleDate);
      vi.spyOn(mockGitService, 'hasChanges').mockResolvedValue(false);
      vi.spyOn(mockGitService, 'getRemoteSyncStatus').mockResolvedValue('synced');

      const result = await worktreeManager.listWorktrees();

      expect(result).toHaveLength(3);
      expect(result[0].commit).toBe('rec456'); // Most recent
      expect(result[1].commit).toBe('mid789'); // Middle
      expect(result[2].commit).toBe('old123'); // Oldest
    });
  });
});
