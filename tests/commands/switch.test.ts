import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { switchCommand } from '../../src/commands/switch';
import { GitService } from '../../src/lib/git';
import { WorktreeManager } from '../../src/lib/worktree';
import fs from 'fs';

// Mock dependencies
vi.mock('../../src/lib/git');
vi.mock('../../src/lib/worktree');
vi.mock('fs');
vi.mock('inquirer', () => ({
  default: {
    createPromptModule: vi.fn(() => vi.fn()),
  },
}));

// Mock logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock tty
vi.mock('tty', () => ({
  default: {
    ReadStream: class MockReadStream {
      destroy() {}
    },
    WriteStream: class MockWriteStream {
      destroy() {}
    },
  },
}));

describe('switchCommand', () => {
  let mockGitService: GitService;
  let mockWorktreeManager: WorktreeManager;
  let consoleLogSpy: MockInstance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let processExitSpy: any;

  const mockWorktrees = [
    {
      path: '/test/project-main',
      branch: 'main',
      commit: 'abc1234',
      isCurrent: true,
      isDetached: false,
      isMain: true,
      isPrunable: false,
    },
    {
      path: '/test/project-feature-auth',
      branch: 'feature/auth',
      commit: 'def5678',
      isCurrent: false,
      isDetached: false,
      isMain: false,
      isPrunable: false,
    },
    {
      path: '/test/project-bugfix-login',
      branch: 'bugfix/login',
      commit: 'ghi9012',
      isCurrent: false,
      isDetached: false,
      isMain: false,
      isPrunable: false,
    },
  ];

  beforeEach(() => {
    mockGitService = new GitService({ cwd: '/test/path' });
    mockWorktreeManager = new WorktreeManager(mockGitService);

    // Mock console.log
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as any);

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('with branch name specified', () => {
    it('should switch to worktree by branch name', async () => {
      // Mock fs.existsSync to return false (not a path)
      vi.mocked(fs.existsSync).mockReturnValue(false);

      // Mock WorktreeManager.listWorktrees
      vi.spyOn(mockWorktreeManager, 'listWorktrees').mockResolvedValue(mockWorktrees);

      // Mock GitService and WorktreeManager constructors
      vi.mocked(GitService).mockImplementation(() => mockGitService);
      vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

      await switchCommand('feature/auth');

      expect(mockWorktreeManager.listWorktrees).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('/test/project-feature-auth');
    });

    it('should handle branch names with slashes', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.spyOn(mockWorktreeManager, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.mocked(GitService).mockImplementation(() => mockGitService);
      vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

      await switchCommand('bugfix/login');

      expect(mockWorktreeManager.listWorktrees).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('/test/project-bugfix-login');
    });

    it('should exit with error when branch does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.spyOn(mockWorktreeManager, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.mocked(GitService).mockImplementation(() => mockGitService);
      vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

      await expect(switchCommand('nonexistent/branch')).rejects.toThrow('process.exit called');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('with path specified', () => {
    it('should switch to worktree by existing worktree path', async () => {
      vi.spyOn(mockWorktreeManager, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.mocked(GitService).mockImplementation(() => mockGitService);
      vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

      const testPath = '/test/project-feature-auth';
      await switchCommand(testPath);

      expect(mockWorktreeManager.listWorktrees).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(testPath);
    });

    it('should switch to worktree by absolute directory path', async () => {
      vi.spyOn(mockWorktreeManager, 'listWorktrees').mockResolvedValue(mockWorktrees);
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(GitService).mockImplementation(() => mockGitService);
      vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

      const testPath = '/some/absolute/path';
      await switchCommand(testPath);

      expect(mockWorktreeManager.listWorktrees).toHaveBeenCalled();
      expect(fs.existsSync).toHaveBeenCalledWith(testPath);
      expect(consoleLogSpy).toHaveBeenCalledWith(testPath);
    });
  });

  describe('without arguments (interactive mode)', () => {
    it('should warn when no worktrees found', async () => {
      vi.spyOn(mockWorktreeManager, 'listWorktrees').mockResolvedValue([]);
      vi.mocked(GitService).mockImplementation(() => mockGitService);
      vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

      await switchCommand(undefined);

      expect(mockWorktreeManager.listWorktrees).toHaveBeenCalled();
      const { logger } = await import('../../src/utils/logger');
      expect(logger.warn).toHaveBeenCalledWith('No worktrees found');
    });

    it('should warn when no other worktrees to switch to', async () => {
      const singleWorktree = [mockWorktrees[0]]; // Only current worktree
      vi.spyOn(mockWorktreeManager, 'listWorktrees').mockResolvedValue(singleWorktree);
      vi.mocked(GitService).mockImplementation(() => mockGitService);
      vi.mocked(WorktreeManager).mockImplementation(() => mockWorktreeManager);

      await switchCommand(undefined);

      const { logger } = await import('../../src/utils/logger');
      expect(logger.warn).toHaveBeenCalledWith('No other worktrees to switch to');
    });
  });
});
