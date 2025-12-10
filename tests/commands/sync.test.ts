import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncCommand } from '../../src/commands/sync';
import { GitService } from '../../src/lib/git';
import { logger } from '../../src/utils/logger';
import { GwtError } from '../../src/utils/errors';

// Mock dependencies
vi.mock('../../src/lib/git');
vi.mock('../../src/utils/logger', () => ({
  logger: {
    highlight: vi.fn(),
    info: vi.fn(),
    step: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('syncCommand', () => {
  let mockGitService: any;
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock GitService
    mockGitService = {
      getCurrentBranch: vi.fn(),
      getBaseBranch: vi.fn(),
      rebaseToBase: vi.fn(),
    };
    vi.mocked(GitService).mockImplementation(() => mockGitService);

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  describe('successful sync', () => {
    it('should sync current branch with auto-detected base branch', async () => {
      const currentBranch = 'feature/test';
      const baseBranch = 'main';

      mockGitService.getCurrentBranch.mockResolvedValue(currentBranch);
      mockGitService.getBaseBranch.mockResolvedValue(baseBranch);
      mockGitService.rebaseToBase.mockResolvedValue(undefined);

      await syncCommand({});

      expect(logger.highlight).toHaveBeenCalledWith('Syncing Worktree');
      expect(mockGitService.getCurrentBranch).toHaveBeenCalled();
      expect(mockGitService.getBaseBranch).toHaveBeenCalled();
      expect(mockGitService.rebaseToBase).toHaveBeenCalledWith(baseBranch);
      expect(logger.info).toHaveBeenCalledWith(`Current branch: ${currentBranch}`);
      expect(logger.info).toHaveBeenCalledWith(`Base branch: ${baseBranch}`);
      expect(logger.step).toHaveBeenCalledWith('Rebasing to latest base branch...');
      expect(logger.success).toHaveBeenCalledWith('Sync completed!');
      expect(logger.info).toHaveBeenCalledWith(
        `Branch ${currentBranch} is now up to date with ${baseBranch}`
      );
    });

    it('should sync with custom base branch', async () => {
      const currentBranch = 'feature/test';
      const customBaseBranch = 'develop';

      mockGitService.getCurrentBranch.mockResolvedValue(currentBranch);
      mockGitService.rebaseToBase.mockResolvedValue(undefined);

      await syncCommand({ baseBranch: customBaseBranch });

      expect(mockGitService.getBaseBranch).not.toHaveBeenCalled();
      expect(mockGitService.rebaseToBase).toHaveBeenCalledWith(customBaseBranch);
      expect(logger.info).toHaveBeenCalledWith(`Base branch: ${customBaseBranch}`);
      expect(logger.info).toHaveBeenCalledWith(
        `Branch ${currentBranch} is now up to date with ${customBaseBranch}`
      );
    });

    it('should use base branch option over auto-detection', async () => {
      const currentBranch = 'feature/test';
      const customBaseBranch = 'develop';

      mockGitService.getCurrentBranch.mockResolvedValue(currentBranch);
      mockGitService.rebaseToBase.mockResolvedValue(undefined);

      await syncCommand({ baseBranch: customBaseBranch });

      expect(mockGitService.getBaseBranch).not.toHaveBeenCalled();
      expect(mockGitService.rebaseToBase).toHaveBeenCalledWith(customBaseBranch);
    });

    it('should sync with different base branches', async () => {
      const currentBranch = 'feature/test';
      const baseBranches = ['main', 'master', 'develop'];

      for (const baseBranch of baseBranches) {
        vi.clearAllMocks();

        mockGitService.getCurrentBranch.mockResolvedValue(currentBranch);
        mockGitService.getBaseBranch.mockResolvedValue(baseBranch);
        mockGitService.rebaseToBase.mockResolvedValue(undefined);

        await syncCommand({});

        expect(mockGitService.rebaseToBase).toHaveBeenCalledWith(baseBranch);
        expect(logger.info).toHaveBeenCalledWith(
          `Branch ${currentBranch} is now up to date with ${baseBranch}`
        );
      }
    });
  });

  describe('error handling', () => {
    it('should handle GwtError during sync and exit with code 1', async () => {
      const error = new GwtError('Rebase conflict');
      mockGitService.getCurrentBranch.mockResolvedValue('feature/test');
      mockGitService.getBaseBranch.mockResolvedValue('main');
      mockGitService.rebaseToBase.mockRejectedValue(error);

      await expect(syncCommand({})).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Rebase conflict');
      expect(logger.warn).toHaveBeenCalledWith('You may need to resolve conflicts manually');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle GwtError during getCurrentBranch and exit with code 1', async () => {
      const error = new GwtError('Not in a git repository');
      mockGitService.getCurrentBranch.mockRejectedValue(error);

      await expect(syncCommand({})).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Not in a git repository');
      expect(logger.warn).toHaveBeenCalledWith('You may need to resolve conflicts manually');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle GwtError during getBaseBranch and exit with code 1', async () => {
      const error = new GwtError('Base branch not found');
      mockGitService.getCurrentBranch.mockResolvedValue('feature/test');
      mockGitService.getBaseBranch.mockRejectedValue(error);

      await expect(syncCommand({})).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Base branch not found');
      expect(logger.warn).toHaveBeenCalledWith('You may need to resolve conflicts manually');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should show debug stack trace when DEBUG env is set', async () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'true';

      const error = new GwtError('Test error');
      error.stack = 'Error stack trace';
      mockGitService.getCurrentBranch.mockResolvedValue('feature/test');
      mockGitService.getBaseBranch.mockResolvedValue('main');
      mockGitService.rebaseToBase.mockRejectedValue(error);

      await expect(syncCommand({})).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(logger.debug).toHaveBeenCalledWith('Error stack trace');

      process.env.DEBUG = originalDebug;
    });

    it('should not show debug stack trace when DEBUG env is not set', async () => {
      const originalDebug = process.env.DEBUG;
      delete process.env.DEBUG;

      const error = new GwtError('Test error');
      error.stack = 'Error stack trace';
      mockGitService.getCurrentBranch.mockResolvedValue('feature/test');
      mockGitService.getBaseBranch.mockResolvedValue('main');
      mockGitService.rebaseToBase.mockRejectedValue(error);

      await expect(syncCommand({})).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(logger.debug).not.toHaveBeenCalled();

      process.env.DEBUG = originalDebug;
    });

    it('should rethrow non-GwtError errors', async () => {
      const error = new Error('Unexpected error');
      mockGitService.getCurrentBranch.mockResolvedValue('feature/test');
      mockGitService.getBaseBranch.mockResolvedValue('main');
      mockGitService.rebaseToBase.mockRejectedValue(error);

      await expect(syncCommand({})).rejects.toThrow('Unexpected error');

      expect(logger.error).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });
});
