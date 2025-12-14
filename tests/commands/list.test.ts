import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listCommand } from '../../src/commands/list';
import { GitService } from '../../src/lib/git';
import { WorktreeManager } from '../../src/lib/worktree';
import { logger } from '../../src/utils/logger';
import { GwtError } from '../../src/utils/errors';
import type { WorktreeInfo } from '../../src/types';

// Mock dependencies
vi.mock('../../src/lib/git');
vi.mock('../../src/lib/worktree');
vi.mock('../../src/utils/logger', () => ({
  logger: {
    highlight: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('listCommand', () => {
  let mockGitService: any;
  let mockWorktreeManager: any;
  let processExitSpy: any;
  let consoleErrorSpy: any;

  const mockWorktrees: WorktreeInfo[] = [
    {
      path: '/path/to/main',
      branch: 'main',
      commit: 'abc1234',
      isMain: true,
      isCurrent: true,
      isDetached: false,
      isPrunable: false,
      lastCommitMessage: 'Initial commit',
      lastCommitDate: new Date('2024-12-14T10:00:00Z'),
      lastCommitDateRelative: '2 hours ago',
      hasChanges: false,
      remoteSyncStatus: 'no-remote' as const,
    },
    {
      path: '/path/to/feature',
      branch: 'feature/test',
      commit: 'def5678',
      isMain: false,
      isCurrent: false,
      isDetached: false,
      isPrunable: false,
      lastCommitMessage: 'Add new feature',
      lastCommitDate: new Date('2024-12-10T10:00:00Z'),
      lastCommitDateRelative: '3 days ago',
      hasChanges: true,
      remoteSyncStatus: 'ahead' as const,
    },
    {
      path: '/path/to/prunable',
      branch: 'feature/old',
      commit: 'ghi9012',
      isMain: false,
      isCurrent: false,
      isDetached: false,
      isPrunable: true,
      lastCommitMessage: 'Old feature',
      lastCommitDate: new Date('2024-11-01T10:00:00Z'),
      lastCommitDateRelative: '6 weeks ago',
      hasChanges: false,
      remoteSyncStatus: 'synced' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock GitService
    mockGitService = {};
    vi.mocked(GitService).mockImplementation(() => mockGitService);

    // Mock WorktreeManager
    mockWorktreeManager = {
      listWorktrees: vi.fn(),
    };
    vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

    // Mock console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  describe('successful listing', () => {
    it('should list all worktrees', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);

      await listCommand();

      expect(logger.highlight).toHaveBeenCalledWith('Git Worktrees');
      expect(consoleErrorSpy).toHaveBeenCalled();
      // Verify that worktree information is displayed (console.error is called multiple times)
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(mockWorktrees.length);
    });

    it('should display current worktree with marker', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);

      await listCommand();

      // Check that console.error was called with strings containing worktree info
      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);
      const hasCurrentMarker = allCalls.some(
        (call: unknown) => typeof call === 'string' && call.includes('/path/to/main')
      );

      expect(hasCurrentMarker).toBe(true);
    });

    it('should display main worktree badge', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);

      await listCommand();

      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);
      const hasMainBadge = allCalls.some(
        (call: unknown) => typeof call === 'string' && call.includes('/path/to/main')
      );

      expect(hasMainBadge).toBe(true);
    });

    it('should display prunable worktree with warning', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);

      await listCommand();

      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);
      const hasPrunableWarning = allCalls.some(
        (call: unknown) => typeof call === 'string' && call.includes('prune')
      );

      expect(hasPrunableWarning).toBe(true);
    });

    it('should display commit messages', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);

      await listCommand();

      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);
      const hasCommitMessage = allCalls.some(
        (call: unknown) =>
          typeof call === 'string' &&
          (call.includes('Initial commit') ||
            call.includes('Add new feature') ||
            call.includes('Old feature'))
      );

      expect(hasCommitMessage).toBe(true);
    });

    it('should truncate long commit messages', async () => {
      const longMessageWorktree: WorktreeInfo[] = [
        {
          path: '/path/to/feature',
          branch: 'feature/test',
          commit: 'abc1234',
          isMain: false,
          isCurrent: false,
          isDetached: false,
          isPrunable: false,
          lastCommitMessage: 'A'.repeat(100), // Very long message
        },
      ];

      mockWorktreeManager.listWorktrees.mockResolvedValue(longMessageWorktree);

      await listCommand();

      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);
      const hasTruncatedMessage = allCalls.some(
        (call: unknown) => typeof call === 'string' && call.includes('...')
      );

      expect(hasTruncatedMessage).toBe(true);
    });

    it('should handle worktree without commit message', async () => {
      const noMessageWorktree: WorktreeInfo[] = [
        {
          path: '/path/to/feature',
          branch: 'feature/test',
          commit: 'abc1234',
          isMain: false,
          isCurrent: false,
          isDetached: false,
          isPrunable: false,
        },
      ];

      mockWorktreeManager.listWorktrees.mockResolvedValue(noMessageWorktree);

      await listCommand();

      expect(logger.highlight).toHaveBeenCalledWith('Git Worktrees');
    });

    it('should display relative time with commit message', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);

      await listCommand();

      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);
      const hasRelativeTime = allCalls.some(
        (call: unknown) =>
          typeof call === 'string' &&
          (call.includes('2 hours ago') ||
            call.includes('3 days ago') ||
            call.includes('6 weeks ago'))
      );

      expect(hasRelativeTime).toBe(true);
    });

    it('should not display icon for clean worktree', async () => {
      const cleanWorktree: WorktreeInfo[] = [
        {
          path: '/path/to/feature',
          branch: 'feature/test',
          commit: 'abc1234',
          isMain: false,
          isCurrent: false,
          isDetached: false,
          isPrunable: false,
          lastCommitMessage: 'Test commit',
          hasChanges: false,
        },
      ];

      mockWorktreeManager.listWorktrees.mockResolvedValue(cleanWorktree);

      await listCommand();

      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);
      // Clean worktree should not have '!' in branch name
      const hasCleanDisplay = allCalls.some(
        (call: unknown) =>
          typeof call === 'string' &&
          call.includes('(feature/test)') &&
          !call.includes('(feature/test !')
      );

      expect(hasCleanDisplay).toBe(true);
    });

    it('should display changes icon for dirty worktree (Starship style)', async () => {
      const dirtyWorktree: WorktreeInfo[] = [
        {
          path: '/path/to/feature',
          branch: 'feature/test',
          commit: 'abc1234',
          isMain: false,
          isCurrent: false,
          isDetached: false,
          isPrunable: false,
          lastCommitMessage: 'Test commit',
          hasChanges: true,
        },
      ];

      mockWorktreeManager.listWorktrees.mockResolvedValue(dirtyWorktree);

      await listCommand();

      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);
      // Dirty worktree should have '!' in branch name
      const hasDirtyIcon = allCalls.some(
        (call: unknown) => typeof call === 'string' && call.includes('!')
      );

      expect(hasDirtyIcon).toBe(true);
    });

    it('should display remote sync icons (Starship style)', async () => {
      const worktreesWithRemoteStatus: WorktreeInfo[] = [
        {
          path: '/path/to/synced',
          branch: 'feature/synced',
          commit: 'abc1234',
          isMain: false,
          isCurrent: false,
          isDetached: false,
          isPrunable: false,
          remoteSyncStatus: 'synced' as const,
        },
        {
          path: '/path/to/ahead',
          branch: 'feature/ahead',
          commit: 'def5678',
          isMain: false,
          isCurrent: false,
          isDetached: false,
          isPrunable: false,
          remoteSyncStatus: 'ahead' as const,
        },
        {
          path: '/path/to/behind',
          branch: 'feature/behind',
          commit: 'ghi9012',
          isMain: false,
          isCurrent: false,
          isDetached: false,
          isPrunable: false,
          remoteSyncStatus: 'behind' as const,
        },
        {
          path: '/path/to/diverged',
          branch: 'feature/diverged',
          commit: 'jkl3456',
          isMain: false,
          isCurrent: false,
          isDetached: false,
          isPrunable: false,
          remoteSyncStatus: 'diverged' as const,
        },
      ];

      mockWorktreeManager.listWorktrees.mockResolvedValue(worktreesWithRemoteStatus);

      await listCommand();

      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);

      // Check for Starship-style sync icons
      // Synced should not display any icon
      const hasSyncedClean = allCalls.some(
        (call: unknown) =>
          typeof call === 'string' &&
          call.includes('(feature/synced)') &&
          !call.includes('⇡') &&
          !call.includes('⇣') &&
          !call.includes('⇕')
      );
      const hasAheadIcon = allCalls.some(
        (call: unknown) => typeof call === 'string' && call.includes('⇡')
      );
      const hasBehindIcon = allCalls.some(
        (call: unknown) => typeof call === 'string' && call.includes('⇣')
      );
      const hasDivergedIcon = allCalls.some(
        (call: unknown) => typeof call === 'string' && call.includes('⇕')
      );

      expect(hasSyncedClean).toBe(true);
      expect(hasAheadIcon).toBe(true);
      expect(hasBehindIcon).toBe(true);
      expect(hasDivergedIcon).toBe(true);
    });

    it('should combine changes and sync status icons', async () => {
      const combinedStatusWorktree: WorktreeInfo[] = [
        {
          path: '/path/to/feature',
          branch: 'feature/test',
          commit: 'abc1234',
          isMain: false,
          isCurrent: false,
          isDetached: false,
          isPrunable: false,
          hasChanges: true,
          remoteSyncStatus: 'behind' as const,
        },
      ];

      mockWorktreeManager.listWorktrees.mockResolvedValue(combinedStatusWorktree);

      await listCommand();

      const allCalls = consoleErrorSpy.mock.calls.map((call: any[]) => call[0]);
      // Should display both ! and ⇣
      const hasCombinedStatus = allCalls.some(
        (call: unknown) => typeof call === 'string' && call.includes('!⇣')
      );

      expect(hasCombinedStatus).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should warn when no worktrees found', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue([]);

      await listCommand();

      expect(logger.warn).toHaveBeenCalledWith('No worktrees found');
    });

    it('should handle empty worktrees array', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue([]);

      await listCommand();

      expect(logger.warn).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle GwtError and exit with code 1', async () => {
      const error = new GwtError('Test error');
      mockWorktreeManager.listWorktrees.mockRejectedValue(error);

      await expect(listCommand()).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should show debug stack trace when DEBUG env is set', async () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'true';

      const error = new GwtError('Test error');
      error.stack = 'Error stack trace';
      mockWorktreeManager.listWorktrees.mockRejectedValue(error);

      await expect(listCommand()).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(logger.debug).toHaveBeenCalledWith('Error stack trace');

      process.env.DEBUG = originalDebug;
    });

    it('should rethrow non-GwtError errors', async () => {
      const error = new Error('Unexpected error');
      mockWorktreeManager.listWorktrees.mockRejectedValue(error);

      await expect(listCommand()).rejects.toThrow('Unexpected error');

      expect(logger.error).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });
});
