import inquirer from 'inquirer';
import fs from 'fs';
import type { DeleteOptions } from '../types/index.js';
import { GitService } from '../lib/git.js';
import { WorktreeManager } from '../lib/worktree.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';

/**
 * Delete command: Remove a worktree
 */
export async function deleteCommand(
  pathOrBranch: string | undefined,
  options: DeleteOptions
): Promise<void> {
  try {
    const gitService = new GitService({ cwd: process.cwd() });
    const worktreeManager = new WorktreeManager(gitService);

    let targetPath = pathOrBranch;
    const worktrees = await worktreeManager.listWorktrees();

    // Resolve path or branch name
    if (targetPath) {
      // Check if it's a valid path
      if (!fs.existsSync(targetPath)) {
        // Not a path, try to find by branch name
        const wtByBranch = worktrees.find((wt) => wt.branch === targetPath);
        if (wtByBranch) {
          targetPath = wtByBranch.path;
        } else {
          logger.error(`Worktree not found for path or branch: ${targetPath}`);
          process.exit(1);
        }
      }

      // Check if trying to delete main worktree
      const targetWt = worktrees.find((wt) => wt.path === targetPath);
      if (targetWt?.isMain) {
        logger.error('Cannot delete main worktree');
        process.exit(1);
      }
    }

    // If no path provided, show interactive selection
    if (!targetPath) {
      if (worktrees.length === 0) {
        logger.warn('No worktrees found');
        return;
      }

      // Filter out current and main worktree
      const deletableWorktrees = worktrees.filter((wt) => !wt.isCurrent && !wt.isMain);

      if (deletableWorktrees.length === 0) {
        logger.warn('No other worktrees to delete (main worktree cannot be deleted)');
        return;
      }

      const { selected } = await inquirer.prompt<{ selected: string }>([
        {
          type: 'list',
          name: 'selected',
          message: 'Select worktree to delete:',
          choices: deletableWorktrees.map((wt) => ({
            name: `${wt.path} (${wt.branch})`,
            value: wt.path,
          })),
        },
      ]);

      targetPath = selected;
    }

    // Confirm deletion unless force flag is set
    if (!options.force) {
      const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete worktree: ${targetPath}?`,
          default: false,
        },
      ]);

      if (!confirm) {
        logger.info('Deletion cancelled');
        return;
      }
    }

    // Delete the worktree
    await worktreeManager.deleteWorktree(targetPath, options.force);
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
