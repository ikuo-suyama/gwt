import chalk from 'chalk';
import { GitService } from '../lib/git.js';
import { WorktreeManager } from '../lib/worktree.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';
import type { WorktreeInfo } from '../types/index.js';

/**
 * List command: Display all worktrees
 */
export async function listCommand(): Promise<void> {
  try {
    const gitService = new GitService({ cwd: process.cwd() });
    const worktreeManager = new WorktreeManager(gitService);

    // Get all worktrees
    const worktrees = await worktreeManager.listWorktrees();

    if (worktrees.length === 0) {
      logger.warn('No worktrees found');
      return;
    }

    // Display worktrees
    logger.highlight('Git Worktrees');
    console.error(); // Empty line

    for (const wt of worktrees) {
      displayWorktree(wt);
    }
  } catch (error) {
    if (error instanceof GwtError) {
      logger.error(error.message);
      if (process.env.DEBUG && error.stack) {
        logger.debug(error.stack);
      }
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Display a single worktree with formatting
 */
function displayWorktree(wt: WorktreeInfo): void {
  const icon = wt.isCurrent ? chalk.green('➤') : ' ';
  const path = chalk.cyan(wt.path);
  const branch = chalk.green(`(${wt.branch})`);
  const commit = chalk.yellow(`[${wt.commit}]`);
  const current = wt.isCurrent ? chalk.bgGreen.black(' *current* ') : '';

  console.error(`${icon} ${path} ${branch} ${commit} ${current}`);

  // Display commit message as sub-info with more indent
  if (wt.lastCommitMessage) {
    const message = wt.lastCommitMessage.split('\n')[0]; // First line only
    const truncated = message.length > 60 ? message.substring(0, 57) + '...' : message;
    console.error(chalk.gray(`    │ ${truncated}`));
  }
}
