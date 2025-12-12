import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitService } from '../../src/lib/git';
import { GitError, BranchNotFoundError, DetachedHeadError } from '../../src/utils/errors';

// Mock simple-git
vi.mock('simple-git', () => {
  const mockGit = {
    raw: vi.fn(),
    revparse: vi.fn(),
    status: vi.fn(),
    checkout: vi.fn(),
    pull: vi.fn(),
    rebase: vi.fn(),
    stash: vi.fn(),
    log: vi.fn(),
    show: vi.fn(),
    fetch: vi.fn(),
  };

  return {
    default: () => mockGit,
  };
});

describe('GitService', () => {
  let gitService: GitService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGit: any;

  beforeEach(async () => {
    const simpleGit = await import('simple-git');
    mockGit = simpleGit.default();
    gitService = new GitService({ cwd: '/test/path' });
    vi.clearAllMocks();
  });

  describe('branchExists', () => {
    it('should return true when local branch exists', async () => {
      mockGit.revparse.mockResolvedValueOnce('abc123');
      const result = await gitService.branchExists('main');
      expect(result).toBe(true);
      expect(mockGit.revparse).toHaveBeenCalledWith(['--verify', 'main']);
    });

    it('should return true when remote branch exists', async () => {
      mockGit.revparse
        .mockRejectedValueOnce(new Error('Local not found'))
        .mockResolvedValueOnce('def456');
      const result = await gitService.branchExists('feature/test');
      expect(result).toBe(true);
      expect(mockGit.revparse).toHaveBeenCalledWith(['--verify', 'origin/feature/test']);
    });

    it('should return false when branch does not exist', async () => {
      mockGit.revparse
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'));
      const result = await gitService.branchExists('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      mockGit.revparse.mockResolvedValue('feature/test\n');
      const result = await gitService.getCurrentBranch();
      expect(result).toBe('feature/test');
    });

    it('should throw DetachedHeadError when in detached HEAD state', async () => {
      mockGit.revparse.mockResolvedValue('HEAD\n');
      await expect(gitService.getCurrentBranch()).rejects.toThrow(DetachedHeadError);
    });

    it('should throw GitError when operation fails', async () => {
      mockGit.revparse.mockRejectedValue(new Error('Git error'));
      await expect(gitService.getCurrentBranch()).rejects.toThrow(GitError);
    });
  });

  describe('getBaseBranch', () => {
    it('should return develop when it exists', async () => {
      mockGit.revparse.mockResolvedValueOnce('abc123');
      const result = await gitService.getBaseBranch();
      expect(result).toBe('develop');
    });

    it('should return master when develop does not exist', async () => {
      mockGit.revparse
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce('abc123');
      const result = await gitService.getBaseBranch();
      expect(result).toBe('master');
    });

    it('should return main when develop and master do not exist', async () => {
      mockGit.revparse
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce('abc123');
      const result = await gitService.getBaseBranch();
      expect(result).toBe('main');
    });

    it('should throw BranchNotFoundError when no base branch exists', async () => {
      mockGit.revparse.mockRejectedValue(new Error('Not found'));
      await expect(gitService.getBaseBranch()).rejects.toThrow(BranchNotFoundError);
    });
  });

  describe('listWorktrees', () => {
    it('should parse worktree list output correctly', async () => {
      const mockOutput = `worktree /path/to/main
HEAD abc1234567
branch refs/heads/main

worktree /path/to/feature
HEAD def5678901
branch refs/heads/feature/test

`;
      mockGit.raw.mockResolvedValue(mockOutput);

      const result = await gitService.listWorktrees();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        path: '/path/to/main',
        branch: 'main',
        commit: 'abc1234',
        isMain: true,
      });
      expect(result[1]).toMatchObject({
        path: '/path/to/feature',
        branch: 'feature/test',
        commit: 'def5678',
        isMain: false,
      });
    });

    it('should handle detached HEAD worktrees', async () => {
      const mockOutput = `worktree /path/to/detached
HEAD abc1234567
detached

`;
      mockGit.raw.mockResolvedValue(mockOutput);

      const result = await gitService.listWorktrees();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        path: '/path/to/detached',
        branch: 'HEAD',
        isDetached: true,
      });
    });

    it('should throw GitError when list operation fails', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));
      await expect(gitService.listWorktrees()).rejects.toThrow(GitError);
    });
  });

  describe('createWorktree', () => {
    it('should create worktree with new branch', async () => {
      mockGit.revparse.mockResolvedValue('abc123');
      mockGit.raw.mockResolvedValue('');

      await gitService.createWorktree('/path/to/new', 'feature/new', true);
      expect(mockGit.raw).toHaveBeenCalledWith([
        'worktree',
        'add',
        '/path/to/new',
        '-b',
        'feature/new',
        expect.any(String),
      ]);
    });

    it('should create worktree with existing branch', async () => {
      mockGit.raw.mockResolvedValue('');

      await gitService.createWorktree('/path/to/existing', 'main', false);
      expect(mockGit.raw).toHaveBeenCalledWith(['worktree', 'add', '/path/to/existing', 'main']);
    });

    it('should throw GitError when create operation fails', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));
      await expect(gitService.createWorktree('/path/to/new', 'feature', true)).rejects.toThrow(
        GitError
      );
    });
  });

  describe('removeWorktree', () => {
    it('should remove worktree without force', async () => {
      mockGit.raw.mockResolvedValue('');

      await gitService.removeWorktree('/path/to/worktree', false);
      expect(mockGit.raw).toHaveBeenCalledWith(['worktree', 'remove', '/path/to/worktree']);
    });

    it('should remove worktree with force', async () => {
      mockGit.raw.mockResolvedValue('');

      await gitService.removeWorktree('/path/to/worktree', true);
      expect(mockGit.raw).toHaveBeenCalledWith([
        'worktree',
        'remove',
        '/path/to/worktree',
        '--force',
      ]);
    });

    it('should throw GitError when remove operation fails', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));
      await expect(gitService.removeWorktree('/path/to/worktree')).rejects.toThrow(GitError);
    });
  });

  describe('pruneWorktrees', () => {
    it('should prune worktrees and return output', async () => {
      mockGit.raw.mockResolvedValue('Pruned 2 worktrees');

      const result = await gitService.pruneWorktrees();
      expect(result).toBe('Pruned 2 worktrees');
      expect(mockGit.raw).toHaveBeenCalledWith(['worktree', 'prune', '-v']);
    });

    it('should throw GitError when prune operation fails', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));
      await expect(gitService.pruneWorktrees()).rejects.toThrow(GitError);
    });
  });

  describe('getLastCommitMessage', () => {
    it('should return latest commit message when no commit specified', async () => {
      mockGit.log.mockResolvedValue({
        latest: { message: 'Latest commit' },
      });

      const result = await gitService.getLastCommitMessage();
      expect(result).toBe('Latest commit');
    });

    it('should return specific commit message', async () => {
      mockGit.show.mockResolvedValue('Specific commit message\n');

      const result = await gitService.getLastCommitMessage('abc123');
      expect(result).toBe('Specific commit message');
      expect(mockGit.show).toHaveBeenCalledWith(['abc123', '--no-patch', '--format=%s']);
    });

    it('should return empty string on error', async () => {
      mockGit.log.mockRejectedValue(new Error('Git error'));

      const result = await gitService.getLastCommitMessage();
      expect(result).toBe('');
    });
  });

  describe('rebaseToBase', () => {
    it('should rebase directly onto origin branch with fetch', async () => {
      mockGit.revparse.mockResolvedValueOnce('abc123');
      mockGit.status.mockResolvedValue({ isClean: () => true });
      mockGit.fetch.mockResolvedValue(undefined);
      mockGit.rebase.mockResolvedValue(undefined);

      await gitService.rebaseToBase();

      expect(mockGit.fetch).toHaveBeenCalledWith('origin');
      expect(mockGit.rebase).toHaveBeenCalledWith(['origin/develop']);
    });

    it('should stash and pop changes during rebase', async () => {
      mockGit.revparse.mockResolvedValueOnce('abc123');
      mockGit.status.mockResolvedValue({ isClean: () => false });
      mockGit.stash.mockResolvedValue(undefined);
      mockGit.fetch.mockResolvedValue(undefined);
      mockGit.rebase.mockResolvedValue(undefined);

      await gitService.rebaseToBase();

      expect(mockGit.stash).toHaveBeenCalledWith(['push', '-m', 'gwt auto-stash before rebase']);
      expect(mockGit.fetch).toHaveBeenCalledWith('origin');
      expect(mockGit.rebase).toHaveBeenCalledWith(['origin/develop']);
      expect(mockGit.stash).toHaveBeenCalledWith(['pop']);
    });

    it('should use custom base branch if provided', async () => {
      mockGit.status.mockResolvedValue({ isClean: () => true });
      mockGit.fetch.mockResolvedValue(undefined);
      mockGit.rebase.mockResolvedValue(undefined);

      await gitService.rebaseToBase('main');

      expect(mockGit.fetch).toHaveBeenCalledWith('origin');
      expect(mockGit.rebase).toHaveBeenCalledWith(['origin/main']);
    });

    it('should throw GitError when rebase fails', async () => {
      mockGit.revparse.mockResolvedValueOnce('abc123');
      mockGit.status.mockResolvedValue({ isClean: () => true });
      mockGit.fetch.mockResolvedValue(undefined);
      mockGit.rebase.mockRejectedValue(new Error('Rebase conflict'));

      await expect(gitService.rebaseToBase()).rejects.toThrow(GitError);
    });
  });
});
