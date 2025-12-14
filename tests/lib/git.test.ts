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
    it('should create worktree with new branch from origin/develop by default', async () => {
      mockGit.revparse.mockResolvedValue('abc123');
      mockGit.raw.mockResolvedValue('');

      await gitService.createWorktree('/path/to/new', 'feature/new', true);
      expect(mockGit.raw).toHaveBeenCalledWith([
        'worktree',
        'add',
        '/path/to/new',
        '-b',
        'feature/new',
        'origin/develop',
      ]);
    });

    it('should create worktree with new branch from custom startPoint', async () => {
      mockGit.raw.mockResolvedValue('');

      await gitService.createWorktree('/path/to/new', 'feature/new', true, 'origin/main');
      expect(mockGit.raw).toHaveBeenCalledWith([
        'worktree',
        'add',
        '/path/to/new',
        '-b',
        'feature/new',
        'origin/main',
      ]);
    });

    it('should create worktree with new branch from HEAD', async () => {
      mockGit.raw.mockResolvedValue('');

      await gitService.createWorktree('/path/to/new', 'feature/new', true, 'feature/base');
      expect(mockGit.raw).toHaveBeenCalledWith([
        'worktree',
        'add',
        '/path/to/new',
        '-b',
        'feature/new',
        'feature/base',
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

  describe('getCommitDate', () => {
    it('should return commit date for a commit hash', async () => {
      mockGit.raw.mockResolvedValue('2024-12-14 10:30:45 +0900\n');

      const result = await gitService.getCommitDate('abc1234');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(new Date('2024-12-14 10:30:45 +0900').toISOString());
      expect(mockGit.raw).toHaveBeenCalledWith(['show', '-s', '--format=%ci', 'abc1234']);
    });

    it('should use git -C when worktreePath is provided', async () => {
      mockGit.raw.mockResolvedValue('2024-12-14 10:30:45 +0900\n');

      await gitService.getCommitDate('abc1234', '/path/to/worktree');
      expect(mockGit.raw).toHaveBeenCalledWith([
        '-C',
        '/path/to/worktree',
        'show',
        '-s',
        '--format=%ci',
        'abc1234',
      ]);
    });

    it('should throw GitError when operation fails', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));

      await expect(gitService.getCommitDate('abc1234')).rejects.toThrow(GitError);
    });
  });

  describe('hasChanges', () => {
    it('should return true when worktree has changes', async () => {
      mockGit.raw.mockResolvedValue('M  src/file.ts\n A  src/new.ts\n');

      const result = await gitService.hasChanges('/path/to/worktree');
      expect(result).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith([
        '-C',
        '/path/to/worktree',
        'status',
        '--porcelain',
      ]);
    });

    it('should return false when worktree is clean', async () => {
      mockGit.raw.mockResolvedValue('');

      const result = await gitService.hasChanges('/path/to/worktree');
      expect(result).toBe(false);
    });

    it('should return false when worktree has only whitespace', async () => {
      mockGit.raw.mockResolvedValue('   \n  \n');

      const result = await gitService.hasChanges('/path/to/worktree');
      expect(result).toBe(false);
    });

    it('should throw GitError when operation fails', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));

      await expect(gitService.hasChanges('/path/to/worktree')).rejects.toThrow(GitError);
    });
  });

  describe('getRemoteSyncStatus', () => {
    it('should return NO_REMOTE for detached HEAD', async () => {
      const result = await gitService.getRemoteSyncStatus('HEAD', '/path/to/worktree');
      expect(result).toBe('no-remote');
    });

    it('should return NO_REMOTE when remote branch does not exist', async () => {
      mockGit.revparse.mockRejectedValue(new Error('Not found'));

      const result = await gitService.getRemoteSyncStatus('feature/test', '/path/to/worktree');
      expect(result).toBe('no-remote');
    });

    it('should return SYNCED when local and remote are equal', async () => {
      mockGit.revparse.mockResolvedValue('abc123'); // Remote branch exists
      mockGit.raw.mockResolvedValue('0\t0\n'); // ahead=0, behind=0

      const result = await gitService.getRemoteSyncStatus('feature/test', '/path/to/worktree');
      expect(result).toBe('synced');
      expect(mockGit.raw).toHaveBeenCalledWith([
        '-C',
        '/path/to/worktree',
        'rev-list',
        '--left-right',
        '--count',
        'feature/test...origin/feature/test',
      ]);
    });

    it('should return AHEAD when local is ahead of remote', async () => {
      mockGit.revparse.mockResolvedValue('abc123');
      mockGit.raw.mockResolvedValue('2\t0\n'); // ahead=2, behind=0

      const result = await gitService.getRemoteSyncStatus('feature/test', '/path/to/worktree');
      expect(result).toBe('ahead');
    });

    it('should return BEHIND when local is behind remote', async () => {
      mockGit.revparse.mockResolvedValue('abc123');
      mockGit.raw.mockResolvedValue('0\t3\n'); // ahead=0, behind=3

      const result = await gitService.getRemoteSyncStatus('feature/test', '/path/to/worktree');
      expect(result).toBe('behind');
    });

    it('should return DIVERGED when local and remote have diverged', async () => {
      mockGit.revparse.mockResolvedValue('abc123');
      mockGit.raw.mockResolvedValue('2\t1\n'); // ahead=2, behind=1

      const result = await gitService.getRemoteSyncStatus('feature/test', '/path/to/worktree');
      expect(result).toBe('diverged');
    });

    it('should return NO_REMOTE on git operation error', async () => {
      mockGit.revparse.mockResolvedValue('abc123');
      mockGit.raw.mockRejectedValue(new Error('Git error'));

      const result = await gitService.getRemoteSyncStatus('feature/test', '/path/to/worktree');
      expect(result).toBe('no-remote');
    });
  });
});
