import path from 'path';
import type { WorktreeOptions } from '../types/index.js';
import { GitService } from './git.js';
import { WorktreeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Worktree management service
 */
export class WorktreeManager {
  constructor(private gitService: GitService) {}

  /**
   * Generate safe directory name from branch name
   * Replaces forward slashes with hyphens
   */
  generateSafeName(branchName: string): string {
    return branchName.replace(/\//g, '-');
  }

  /**
   * Compute worktree path based on current directory and branch
   */
  computeWorktreePath(branchName: string, customPath?: string): string {
    if (customPath) {
      return path.resolve(customPath);
    }

    const currentDir = path.basename(process.cwd());
    const safeBranchName = this.generateSafeName(branchName);
    return path.resolve('..', `${currentDir}-${safeBranchName}`);
  }

  /**
   * Create a worktree with options
   */
  async createWorktree(options: WorktreeOptions): Promise<string> {
    const {
      branchName: inputBranch,
      autoRebase = true,
      copyEnv = true,
      baseBranch,
      customPath,
    } = options;

    // Determine branch name
    let branchName = inputBranch;
    if (!branchName) {
      logger.step('No branch name provided, using current branch');
      branchName = await this.gitService.getCurrentBranch();
    }

    logger.step(`Creating worktree for branch: ${branchName}`);

    // Check if branch exists
    const branchExists = await this.gitService.branchExists(branchName);

    // Compute worktree path
    const worktreePath = this.computeWorktreePath(branchName, customPath);

    // Create worktree
    if (branchExists) {
      logger.info(`Using existing branch: ${branchName}`);
      await this.gitService.createWorktree(worktreePath, branchName, false);
    } else {
      logger.info(`Creating new branch: ${branchName}`);
      await this.gitService.createWorktree(worktreePath, branchName, true);
    }

    logger.success(`Worktree created: ${worktreePath}`);

    // Copy .env files if enabled
    if (copyEnv) {
      await this.copyEnvFiles(process.cwd(), worktreePath);
    }

    // Perform auto-rebase if enabled
    if (autoRebase) {
      logger.step('Performing auto-rebase...');
      const currentDir = process.cwd();
      try {
        process.chdir(worktreePath);
        await this.gitService.rebaseToBase(baseBranch);
        logger.success('Auto-rebase completed');
      } catch (error) {
        logger.warn('Auto-rebase failed, you may need to rebase manually');
      } finally {
        process.chdir(currentDir);
      }
    }

    return worktreePath;
  }

  /**
   * Copy .env files from source to target
   */
  async copyEnvFiles(sourcePath: string, targetPath: string): Promise<void> {
    const fs = await import('fs-extra');
    const envFiles = ['.env', '.env.local', '.env.development'];

    let copiedCount = 0;

    for (const file of envFiles) {
      const srcPath = path.join(sourcePath, file);
      const destPath = path.join(targetPath, file);

      try {
        if (await fs.pathExists(srcPath)) {
          await fs.copy(srcPath, destPath);
          logger.info(`Copied ${file}`);
          copiedCount++;
        }
      } catch (error) {
        logger.warn(`Failed to copy ${file}`);
      }
    }

    if (copiedCount === 0) {
      logger.info('No .env files found to copy');
    }
  }

  /**
   * Delete a worktree
   */
  async deleteWorktree(worktreePath: string, force = false): Promise<void> {
    try {
      await this.gitService.removeWorktree(worktreePath, force);
      logger.success(`Worktree deleted: ${worktreePath}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new WorktreeError(`Failed to delete worktree: ${error.message}`, worktreePath);
      }
      throw error;
    }
  }

  /**
   * Get all worktrees with enhanced information
   */
  async listWorktrees() {
    const worktrees = await this.gitService.listWorktrees();

    // Enhance with commit messages
    for (const wt of worktrees) {
      wt.lastCommitMessage = await this.gitService.getLastCommitMessage(wt.commit);
    }

    return worktrees;
  }
}
