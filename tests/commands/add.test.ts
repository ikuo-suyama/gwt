import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCommand } from '../../src/commands/add';
import { GitService } from '../../src/lib/git';
import { WorktreeManager } from '../../src/lib/worktree';
import { logger } from '../../src/utils/logger';
import { GwtError } from '../../src/utils/errors';

// Mock dependencies
vi.mock('../../src/lib/git');
vi.mock('../../src/lib/worktree');
vi.mock('../../src/utils/logger', () => ({
  logger: {
    highlight: vi.fn(),
    separator: vi.fn(),
    success: vi.fn(),
    plain: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('addCommand', () => {
  let mockGitService: any;
  let mockWorktreeManager: any;
  let consoleLogSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock GitService
    mockGitService = {
      branchExists: vi.fn(),
      getCurrentBranch: vi.fn(),
      getBaseBranch: vi.fn(),
    };
    vi.mocked(GitService).mockImplementation(() => mockGitService);

    // Mock WorktreeManager
    mockWorktreeManager = {
      createWorktree: vi.fn(),
    };
    vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

    // Mock console.log
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  describe('successful worktree creation', () => {
    it('should create worktree with default options', async () => {
      const branchName = 'feature/test';
      const worktreePath = '/path/to/worktree';

      mockWorktreeManager.createWorktree.mockResolvedValue(worktreePath);

      await addCommand(branchName, {});

      expect(mockWorktreeManager.createWorktree).toHaveBeenCalledWith({
        branchName: 'feature/test',
        autoRebase: true,
        copyEnv: true,
        baseBranch: undefined,
        customPath: undefined,
      });

      expect(logger.highlight).toHaveBeenCalledWith('Creating Git Worktree');
      expect(logger.success).toHaveBeenCalledWith('Worktree is ready!');
      expect(logger.plain).toHaveBeenCalledWith(`📂 Path: ${worktreePath}`);
      expect(logger.plain).toHaveBeenCalledWith(`🌿 Branch: ${branchName}`);
      expect(consoleLogSpy).toHaveBeenCalledWith(worktreePath);
    });

    it('should create worktree without branch name (current branch)', async () => {
      const worktreePath = '/path/to/worktree';

      mockWorktreeManager.createWorktree.mockResolvedValue(worktreePath);

      await addCommand(undefined, {});

      expect(mockWorktreeManager.createWorktree).toHaveBeenCalledWith({
        branchName: undefined,
        autoRebase: true,
        copyEnv: true,
        baseBranch: undefined,
        customPath: undefined,
      });

      expect(logger.plain).toHaveBeenCalledWith(`🌿 Branch: (current branch)`);
    });

    it('should create worktree with custom options', async () => {
      const branchName = 'feature/test';
      const worktreePath = '/custom/path';
      const options = {
        rebase: false,
        env: false,
        base: 'develop',
        path: '/custom/path',
      };

      mockWorktreeManager.createWorktree.mockResolvedValue(worktreePath);

      await addCommand(branchName, options);

      expect(mockWorktreeManager.createWorktree).toHaveBeenCalledWith({
        branchName: 'feature/test',
        autoRebase: false,
        copyEnv: false,
        baseBranch: 'develop',
        customPath: '/custom/path',
      });
    });

    it('should handle rebase option explicitly set to true', async () => {
      const branchName = 'feature/test';
      const worktreePath = '/path/to/worktree';

      mockWorktreeManager.createWorktree.mockResolvedValue(worktreePath);

      await addCommand(branchName, { rebase: true });

      expect(mockWorktreeManager.createWorktree).toHaveBeenCalledWith({
        branchName: 'feature/test',
        autoRebase: true,
        copyEnv: true,
        baseBranch: undefined,
        customPath: undefined,
      });
    });

    it('should handle env option explicitly set to true', async () => {
      const branchName = 'feature/test';
      const worktreePath = '/path/to/worktree';

      mockWorktreeManager.createWorktree.mockResolvedValue(worktreePath);

      await addCommand(branchName, { env: true });

      expect(mockWorktreeManager.createWorktree).toHaveBeenCalledWith({
        branchName: 'feature/test',
        autoRebase: true,
        copyEnv: true,
        baseBranch: undefined,
        customPath: undefined,
      });
    });
  });

  describe('error handling', () => {
    it('should handle GwtError and exit with code 1', async () => {
      const error = new GwtError('Test error');
      mockWorktreeManager.createWorktree.mockRejectedValue(error);

      await expect(addCommand('feature/test', {})).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should show debug stack trace when DEBUG env is set', async () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'true';

      const error = new GwtError('Test error');
      error.stack = 'Error stack trace';
      mockWorktreeManager.createWorktree.mockRejectedValue(error);

      await expect(addCommand('feature/test', {})).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(logger.debug).toHaveBeenCalledWith('Error stack trace');
      expect(processExitSpy).toHaveBeenCalledWith(1);

      process.env.DEBUG = originalDebug;
    });

    it('should not show debug stack trace when DEBUG env is not set', async () => {
      const originalDebug = process.env.DEBUG;
      delete process.env.DEBUG;

      const error = new GwtError('Test error');
      error.stack = 'Error stack trace';
      mockWorktreeManager.createWorktree.mockRejectedValue(error);

      await expect(addCommand('feature/test', {})).rejects.toThrow('process.exit called');

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(logger.debug).not.toHaveBeenCalled();

      process.env.DEBUG = originalDebug;
    });

    it('should rethrow non-GwtError errors', async () => {
      const error = new Error('Unexpected error');
      mockWorktreeManager.createWorktree.mockRejectedValue(error);

      await expect(addCommand('feature/test', {})).rejects.toThrow('Unexpected error');

      expect(logger.error).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });
});
