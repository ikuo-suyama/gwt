import inquirer from 'inquirer';
import { GitService } from '../lib/git.js';
import { WorktreeManager } from '../lib/worktree.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';

/**
 * Switch command: Switch to a different worktree
 */
export async function switchCommand(worktreePath: string | undefined): Promise<void> {
  try {
    const gitService = new GitService({ cwd: process.cwd() });
    const worktreeManager = new WorktreeManager(gitService);

    let targetPath = worktreePath;

    // If no path provided, show interactive selection
    if (!targetPath) {
      const worktrees = await worktreeManager.listWorktrees();

      if (worktrees.length === 0) {
        logger.warn('No worktrees found');
        return;
      }

      // Filter out current worktree
      const otherWorktrees = worktrees.filter((wt) => !wt.isCurrent);

      if (otherWorktrees.length === 0) {
        logger.warn('No other worktrees to switch to');
        return;
      }

      const { selected } = await inquirer.prompt<{ selected: string }>([
        {
          type: 'list',
          name: 'selected',
          message: 'Select worktree to switch to:',
          choices: otherWorktrees.map((wt) => ({
            name: `${wt.path} (${wt.branch})`,
            value: wt.path,
          })),
        },
      ]);

      targetPath = selected;
    }

    // Output the path for shell integration to use
    // Shell function will cd to this path
    console.log(targetPath);
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
