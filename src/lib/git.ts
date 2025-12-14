import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import type { GitConfig, WorktreeInfo } from '../types/index.js';
import { RemoteSyncStatus } from '../types/index.js';
import { GitError, BranchNotFoundError, DetachedHeadError } from '../utils/errors.js';

/**
 * Git operations service
 */
export class GitService {
  private git: SimpleGit;

  constructor(config: GitConfig) {
    const options: Partial<SimpleGitOptions> = {
      baseDir: config.cwd,
      binary: 'git',
      maxConcurrentProcesses: 6,
    };
    this.git = simpleGit(options);
  }

  /**
   * Get the default branch from remote
   */
  async getDefaultBranch(): Promise<string> {
    try {
      // Try to get symbolic-ref from remote HEAD
      const result = await this.git.raw(['symbolic-ref', 'refs/remotes/origin/HEAD']);
      const match = result.trim().match(/refs\/remotes\/origin\/(.+)/);
      if (match) {
        return match[1];
      }
    } catch {
      // Fallback to finding base branch
    }

    return this.getBaseBranch();
  }

  /**
   * Find base branch in priority order: develop → master → main
   */
  async getBaseBranch(): Promise<string> {
    const branches = ['develop', 'master', 'main'];

    for (const branch of branches) {
      if (await this.branchExists(branch)) {
        return branch;
      }
    }

    throw new BranchNotFoundError('No base branch found (develop, master, or main)');
  }

  /**
   * Check if a branch exists (local or remote)
   */
  async branchExists(branchName: string): Promise<boolean> {
    try {
      await this.git.revparse(['--verify', branchName]);
      return true;
    } catch {
      try {
        await this.git.revparse(['--verify', `origin/${branchName}`]);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
      const branchName = branch.trim();

      if (branchName === 'HEAD') {
        throw new DetachedHeadError();
      }

      return branchName;
    } catch (error) {
      if (error instanceof DetachedHeadError) {
        throw error;
      }
      throw new GitError('Failed to get current branch', 'git rev-parse --abbrev-ref HEAD');
    }
  }

  /**
   * List all worktrees
   */
  async listWorktrees(): Promise<WorktreeInfo[]> {
    try {
      const output = await this.git.raw(['worktree', 'list', '--porcelain']);
      return this.parseWorktreeList(output);
    } catch (error) {
      throw new GitError('Failed to list worktrees', 'git worktree list --porcelain');
    }
  }

  /**
   * Parse worktree list output
   */
  private parseWorktreeList(output: string): WorktreeInfo[] {
    const worktrees: WorktreeInfo[] = [];
    const lines = output.split('\n');
    let current: Partial<WorktreeInfo> = {};
    let isFirstWorktree = true;

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        if (current.path) {
          worktrees.push(current as WorktreeInfo);
        }
        current = {
          path: line.substring('worktree '.length),
          isCurrent: false,
          isDetached: false,
          isMain: isFirstWorktree, // First worktree is the main one
          isPrunable: false,
        };
        isFirstWorktree = false;
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.substring('HEAD '.length).substring(0, 7);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring('branch '.length).replace('refs/heads/', '');
      } else if (line === 'detached') {
        current.isDetached = true;
        current.branch = 'HEAD';
      } else if (line.startsWith('prunable')) {
        current.isPrunable = true;
      } else if (line === '') {
        if (current.path) {
          worktrees.push(current as WorktreeInfo);
          current = {};
        }
      }
    }

    if (current.path) {
      worktrees.push(current as WorktreeInfo);
    }

    // Mark the current worktree
    const cwd = process.cwd();
    for (const wt of worktrees) {
      wt.isCurrent = wt.path === cwd;
    }

    return worktrees;
  }

  /**
   * Create a new worktree
   */
  async createWorktree(
    path: string,
    branch: string,
    createNew: boolean,
    startPoint?: string
  ): Promise<void> {
    try {
      if (createNew) {
        // Use provided startPoint or default to origin/baseBranch
        const from = startPoint || `origin/${await this.getBaseBranch()}`;
        await this.git.raw(['worktree', 'add', path, '-b', branch, from]);
      } else {
        await this.git.raw(['worktree', 'add', path, branch]);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new GitError(
          `Failed to create worktree: ${error.message}`,
          `git worktree add ${path} ${createNew ? `-b ${branch}` : branch}`
        );
      }
      throw error;
    }
  }

  /**
   * Remove a worktree
   */
  async removeWorktree(path: string, force = false): Promise<void> {
    try {
      const args = ['worktree', 'remove', path];
      if (force) {
        args.push('--force');
      }
      await this.git.raw(args);
    } catch (error) {
      if (error instanceof Error) {
        throw new GitError(
          `Failed to remove worktree: ${error.message}`,
          `git worktree remove ${path}${force ? ' --force' : ''}`
        );
      }
      throw error;
    }
  }

  /**
   * Prune worktrees
   */
  async pruneWorktrees(): Promise<string> {
    try {
      const output = await this.git.raw(['worktree', 'prune', '-v']);
      return output;
    } catch (error) {
      if (error instanceof Error) {
        throw new GitError(`Failed to prune worktrees: ${error.message}`, 'git worktree prune -v');
      }
      throw error;
    }
  }

  /**
   * Rebase current branch to base branch
   */
  async rebaseToBase(baseBranch?: string): Promise<void> {
    try {
      const targetBase = baseBranch || (await this.getBaseBranch());

      // Stash changes if any
      const status = await this.git.status();
      const hasChanges = !status.isClean();
      if (hasChanges) {
        await this.git.stash(['push', '-m', 'gwt auto-stash before rebase']);
      }

      // Fetch latest from remote
      await this.git.fetch('origin');

      // Rebase directly onto remote branch (avoids worktree conflicts)
      await this.git.rebase([`origin/${targetBase}`]);

      // Pop stash if we stashed
      if (hasChanges) {
        try {
          await this.git.stash(['pop']);
        } catch {
          // Ignore stash pop errors (might have conflicts)
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new GitError(`Failed to rebase: ${error.message}`, 'git rebase');
      }
      throw error;
    }
  }

  /**
   * Pull latest changes for a branch
   */
  async pullBranch(branchName: string): Promise<void> {
    try {
      await this.git.pull('origin', branchName);
    } catch (error) {
      if (error instanceof Error) {
        throw new GitError(
          `Failed to pull branch: ${error.message}`,
          `git pull origin ${branchName}`
        );
      }
      throw error;
    }
  }

  /**
   * Get last commit message for a commit hash
   */
  async getLastCommitMessage(commit?: string): Promise<string> {
    try {
      if (!commit) {
        const log = await this.git.log({ maxCount: 1 });
        return log.latest?.message || '';
      }
      // Use git show to get specific commit message
      const result = await this.git.show([commit, '--no-patch', '--format=%s']);
      return result.trim();
    } catch {
      return '';
    }
  }

  /**
   * Get commit date for a specific commit
   * @param commit - Commit hash (short or full)
   * @param worktreePath - Path to worktree (for git -C option)
   * @returns Commit date as Date object
   */
  async getCommitDate(commit: string, worktreePath?: string): Promise<Date> {
    try {
      const args = worktreePath ? ['-C', worktreePath] : [];
      const result = await this.git.raw([
        ...args,
        'show',
        '-s',
        '--format=%ci', // ISO 8601 format
        commit,
      ]);
      return new Date(result.trim());
    } catch (error) {
      throw new GitError(
        `Failed to get commit date: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `git show -s --format=%ci ${commit}`
      );
    }
  }

  /**
   * Check if worktree has uncommitted changes
   * @param worktreePath - Path to worktree
   * @returns true if there are staged or unstaged changes
   */
  async hasChanges(worktreePath: string): Promise<boolean> {
    try {
      // Use git -C to check status in specific worktree
      const result = await this.git.raw(['-C', worktreePath, 'status', '--porcelain']);
      return result.trim().length > 0;
    } catch (error) {
      throw new GitError(
        `Failed to check worktree changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `git -C ${worktreePath} status --porcelain`
      );
    }
  }

  /**
   * Get remote sync status for a branch
   * @param branch - Branch name
   * @param worktreePath - Path to worktree
   * @returns Remote sync status
   */
  async getRemoteSyncStatus(branch: string, worktreePath: string): Promise<RemoteSyncStatus> {
    try {
      // For detached HEAD, return NO_REMOTE
      if (branch === 'HEAD') {
        return RemoteSyncStatus.NO_REMOTE;
      }

      // Check if remote branch exists
      const remoteBranch = `origin/${branch}`;
      const remoteExists = await this.branchExists(remoteBranch);

      if (!remoteExists) {
        return RemoteSyncStatus.NO_REMOTE;
      }

      // Compare local and remote using rev-list
      const result = await this.git.raw([
        '-C',
        worktreePath,
        'rev-list',
        '--left-right',
        '--count',
        `${branch}...${remoteBranch}`,
      ]);

      // Output format: "<ahead>\t<behind>"
      const [ahead, behind] = result.trim().split('\t').map(Number);

      if (ahead === 0 && behind === 0) return RemoteSyncStatus.SYNCED;
      if (ahead > 0 && behind === 0) return RemoteSyncStatus.AHEAD;
      if (ahead === 0 && behind > 0) return RemoteSyncStatus.BEHIND;
      return RemoteSyncStatus.DIVERGED;
    } catch {
      // If error occurs (e.g., no remote tracking), return NO_REMOTE
      return RemoteSyncStatus.NO_REMOTE;
    }
  }
}
