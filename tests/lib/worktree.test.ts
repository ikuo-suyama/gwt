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
    it('should list worktrees with commit messages', async () => {
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

      vi.spyOn(mockGitService, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.spyOn(mockGitService, 'getLastCommitMessage')
        .mockResolvedValueOnce('Initial commit')
        .mockResolvedValueOnce('Add feature');

      const result = await worktreeManager.listWorktrees();
      expect(result).toHaveLength(2);
      expect(result[0].lastCommitMessage).toBe('Initial commit');
      expect(result[1].lastCommitMessage).toBe('Add feature');
      expect(mockGitService.getLastCommitMessage).toHaveBeenCalledTimes(2);
    });
  });
});
