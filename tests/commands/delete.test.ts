import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteCommand } from '../../src/commands/delete';
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
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
  },
}));
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('deleteCommand', () => {
  let mockGitService: any;
  let mockWorktreeManager: any;
  let processExitSpy: any;
  let mockInquirer: any;
  let mockFs: any;

  const mockWorktrees: WorktreeInfo[] = [
    {
      path: '/path/to/main',
      branch: 'main',
      commit: 'abc1234',
      isMain: true,
      isCurrent: true,
      isDetached: false,
      isPrunable: false,
    },
    {
      path: '/path/to/feature',
      branch: 'feature/test',
      commit: 'def5678',
      isMain: false,
      isCurrent: false,
      isDetached: false,
      isPrunable: false,
    },
    {
      path: '/path/to/another',
      branch: 'feature/another',
      commit: 'ghi9012',
      isMain: false,
      isCurrent: false,
      isDetached: false,
      isPrunable: false,
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock GitService
    mockGitService = {};
    vi.mocked(GitService).mockImplementation(() => mockGitService);

    // Mock WorktreeManager
    mockWorktreeManager = {
      listWorktrees: vi.fn(),
      deleteWorktree: vi.fn(),
    };
    vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Import mocked modules
    const inquirer = await import('inquirer');
    mockInquirer = inquirer.default;

    const fs = await import('fs');
    mockFs = fs.default;
  });

  describe('successful deletion', () => {
    it('should delete worktree by path with confirmation', async () => {
      const targetPath = '/path/to/feature';
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);
      mockFs.existsSync.mockReturnValue(true);
      mockInquirer.prompt.mockResolvedValue({ confirm: true });

      await deleteCommand(targetPath, { force: false });

      expect(mockWorktreeManager.deleteWorktree).toHaveBeenCalledWith(targetPath, false);
    });

    it('should delete worktree by branch name', async () => {
      const branchName = 'feature/test';
      const expectedPath = '/path/to/feature';

      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);
      mockFs.existsSync.mockReturnValue(false);
      mockInquirer.prompt.mockResolvedValue({ confirm: true });

      await deleteCommand(branchName, { force: false });

      expect(mockWorktreeManager.deleteWorktree).toHaveBeenCalledWith(expectedPath, false);
    });

    it('should delete worktree with force option', async () => {
      const targetPath = '/path/to/feature';
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);
      mockFs.existsSync.mockReturnValue(true);

      await deleteCommand(targetPath, { force: true });

      expect(mockInquirer.prompt).not.toHaveBeenCalled();
      expect(mockWorktreeManager.deleteWorktree).toHaveBeenCalledWith(targetPath, true);
    });

    it('should show interactive selection when no path provided', async () => {
      const selectedPath = '/path/to/feature';
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);
      mockInquirer.prompt
        .mockResolvedValueOnce({ selected: selectedPath })
        .mockResolvedValueOnce({ confirm: true });

      await deleteCommand(undefined, { force: false });

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'list',
          name: 'selected',
          message: 'Select worktree to delete:',
          choices: [
            {
              name: '/path/to/feature (feature/test)',
              value: '/path/to/feature',
            },
            {
              name: '/path/to/another (feature/another)',
              value: '/path/to/another',
            },
          ],
        },
      ]);
      expect(mockWorktreeManager.deleteWorktree).toHaveBeenCalledWith(selectedPath, false);
    });

    it('should cancel deletion when user declines confirmation', async () => {
      const targetPath = '/path/to/feature';
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);
      mockFs.existsSync.mockReturnValue(true);
      mockInquirer.prompt.mockResolvedValue({ confirm: false });

      await deleteCommand(targetPath, { force: false });

      expect(logger.info).toHaveBeenCalledWith('Deletion cancelled');
      expect(mockWorktreeManager.deleteWorktree).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should warn when no worktrees found', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue([]);

      await deleteCommand(undefined, { force: false });

      expect(logger.warn).toHaveBeenCalledWith('No worktrees found');
      expect(mockWorktreeManager.deleteWorktree).not.toHaveBeenCalled();
    });

    it('should warn when no deletable worktrees (only main and current)', async () => {
      const onlyMainWorktree: WorktreeInfo[] = [
        {
          path: '/path/to/main',
          branch: 'main',
          commit: 'abc1234',
          isMain: true,
          isCurrent: true,
          isDetached: false,
          isPrunable: false,
        },
      ];

      mockWorktreeManager.listWorktrees.mockResolvedValue(onlyMainWorktree);

      await deleteCommand(undefined, { force: false });

      expect(logger.warn).toHaveBeenCalledWith(
        'No other worktrees to delete (main worktree cannot be deleted)'
      );
      expect(mockWorktreeManager.deleteWorktree).not.toHaveBeenCalled();
    });

    it('should exit when trying to delete main worktree', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);
      mockFs.existsSync.mockReturnValue(true);

      await expect(deleteCommand('/path/to/main', { force: false })).rejects.toThrow(
        'process.exit called'
      );

      expect(logger.error).toHaveBeenCalledWith('Cannot delete main worktree');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit when worktree not found', async () => {
      mockWorktreeManager.listWorktrees.mockResolvedValue(mockWorktrees);
      mockFs.existsSync.mockReturnValue(false);

      await expect(deleteCommand('nonexistent', { force: false })).rejects.toThrow(
        'process.exit called'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Worktree not found for path or branch: nonexistent'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('error handling', () => {
    it('should handle GwtError and exit with code 1', async () => {
      const error = new GwtError('Test error');
      mockWorktreeManager.listWorktrees.mockRejectedValue(error);

      await expect(deleteCommand('/path/to/feature', { force: false })).rejects.toThrow(
        'process.exit called'
      );

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should show debug stack trace when DEBUG env is set', async () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'true';

      const error = new GwtError('Test error');
      error.stack = 'Error stack trace';
      mockWorktreeManager.listWorktrees.mockRejectedValue(error);

      await expect(deleteCommand('/path/to/feature', { force: false })).rejects.toThrow(
        'process.exit called'
      );

      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(logger.debug).toHaveBeenCalledWith('Error stack trace');

      process.env.DEBUG = originalDebug;
    });

    it('should rethrow non-GwtError errors', async () => {
      const error = new Error('Unexpected error');
      mockWorktreeManager.listWorktrees.mockRejectedValue(error);

      await expect(deleteCommand('/path/to/feature', { force: false })).rejects.toThrow(
        'Unexpected error'
      );

      expect(logger.error).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });
});
