import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pruneCommand } from '../../src/commands/prune';
import { GitService } from '../../src/lib/git';
import { logger } from '../../src/utils/logger';
import { GwtError } from '../../src/utils/errors';

// Mock dependencies
vi.mock('../../src/lib/git');
vi.mock('../../src/utils/logger', () => ({
  logger: {
    step: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('pruneCommand', () => {
  let mockGitService: any;
  let processExitSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock GitService
    mockGitService = {
      pruneWorktrees: vi.fn(),
    };
    vi.mocked(GitService).mockImplementation(() => mockGitService);

    // Mock console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  describe('successful pruning', () => {
    it('should prune worktrees and display output when there are prunable worktrees', async () => {
      const pruneOutput = 'Pruned worktree /path/to/old-worktree\n';
      mockGitService.pruneWorktrees.mockResolvedValue(pruneOutput);

      await pruneCommand();

      expect(logger.step).toHaveBeenCalledWith('Checking for manually deleted worktrees...');
      expect(logger.success).toHaveBeenCalledWith('Cleaned up references for deleted worktrees:');
      expect(consoleErrorSpy).toHaveBeenCalledWith(pruneOutput);
    });

    it('should show success message when no pruning needed', async () => {
      mockGitService.pruneWorktrees.mockResolvedValue('');

      await pruneCommand();

      expect(logger.step).toHaveBeenCalledWith('Checking for manually deleted worktrees...');
      expect(logger.success).toHaveBeenCalledWith('All worktrees are in sync');
      expect(logger.info).toHaveBeenCalledWith(
        'No cleanup needed (prune only removes references to manually deleted worktrees)'
      );
    });

    it('should handle whitespace-only output as empty', async () => {
      mockGitService.pruneWorktrees.mockResolvedValue('   \n  ');

      await pruneCommand();

      expect(logger.success).toHaveBeenCalledWith('All worktrees are in sync');
      expect(logger.info).toHaveBeenCalledWith(
        'No cleanup needed (prune only removes references to manually deleted worktrees)'
      );
    });

    it('should display multiple pruned worktrees', async () => {
      const pruneOutput = `Pruned worktree /path/to/old-worktree-1
Pruned worktree /path/to/old-worktree-2
Pruned worktree /path/to/old-worktree-3
`;
      mockGitService.pruneWorktrees.mockResolvedValue(pruneOutput);

      await pruneCommand();

      expect(logger.success).toHaveBeenCalledWith('Cleaned up references for deleted worktrees:');
      expect(consoleErrorSpy).toHaveBeenCalledWith(pruneOutput);
    });
  });

  describe('error handling', () => {
    it('should handle GwtError and exit with code 1', async () => {
      const error = new GwtError('Test error');
      mockGitService.pruneWorktrees.mockRejectedValue(error);

      await expect(pruneCommand()).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should show debug stack trace when DEBUG env is set', async () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'true';

      const error = new GwtError('Test error');
      error.stack = 'Error stack trace';
      mockGitService.pruneWorktrees.mockRejectedValue(error);

      await expect(pruneCommand()).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(logger.debug).toHaveBeenCalledWith('Error stack trace');

      process.env.DEBUG = originalDebug;
    });

    it('should not show debug stack trace when DEBUG env is not set', async () => {
      const originalDebug = process.env.DEBUG;
      delete process.env.DEBUG;

      const error = new GwtError('Test error');
      error.stack = 'Error stack trace';
      mockGitService.pruneWorktrees.mockRejectedValue(error);

      await expect(pruneCommand()).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(logger.debug).not.toHaveBeenCalled();

      process.env.DEBUG = originalDebug;
    });

    it('should rethrow non-GwtError errors', async () => {
      const error = new Error('Unexpected error');
      mockGitService.pruneWorktrees.mockRejectedValue(error);

      await expect(pruneCommand()).rejects.toThrow('Unexpected error');

      expect(logger.error).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });
});
