import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import type { GitConfig, WorktreeInfo } from '../types/index.js';
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
        };
        isFirstWorktree = false;
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.substring('HEAD '.length).substring(0, 7);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring('branch '.length).replace('refs/heads/', '');
      } else if (line === 'detached') {
        current.isDetached = true;
        current.branch = 'HEAD';
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
  async createWorktree(path: string, branch: string, createNew: boolean): Promise<void> {
    try {
      if (createNew) {
        const baseBranch = await this.getBaseBranch();
        await this.git.raw(['worktree', 'add', path, '-b', branch, baseBranch]);
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
        throw new GitError(
          `Failed to prune worktrees: ${error.message}`,
          'git worktree prune -v'
        );
      }
      throw error;
    }
  }

  /**
   * Rebase current branch to base branch
   */
  async rebaseToBase(baseBranch?: string): Promise<void> {
    try {
      const currentBranch = await this.getCurrentBranch();
      const targetBase = baseBranch || (await this.getBaseBranch());

      // Stash changes if any
      const status = await this.git.status();
      const hasChanges = !status.isClean();
      if (hasChanges) {
        await this.git.stash(['push', '-m', 'gwt auto-stash before rebase']);
      }

      // Checkout base branch and pull
      await this.git.checkout(targetBase);
      await this.git.pull();

      // Checkout back to current branch and rebase
      await this.git.checkout(currentBranch);
      await this.git.rebase([targetBase]);

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
}
