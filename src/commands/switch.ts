import inquirer from 'inquirer';
import { GitService } from '../lib/git.js';
import { WorktreeManager } from '../lib/worktree.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';
import tty from 'tty';
import fs from 'fs';

/**
 * Switch command: Switch to a different worktree
 * @param worktreePath - Path to worktree or branch name
 */
export async function switchCommand(worktreePath: string | undefined): Promise<void> {
  try {
    const gitService = new GitService({ cwd: process.cwd() });
    const worktreeManager = new WorktreeManager(gitService);

    let targetPath = worktreePath;

    // If no path/branch provided, show interactive selection
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

      // Create inquirer instance with /dev/tty for shell integration
      const input = new tty.ReadStream(fs.openSync('/dev/tty', 'r'));
      const output = new tty.WriteStream(fs.openSync('/dev/tty', 'w'));

      const customPrompt = inquirer.createPromptModule({ input, output });

      const { selected } = await customPrompt<{ selected: string }>([
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

      // Close streams
      input.destroy();
      output.destroy();

      targetPath = selected;
    } else {
      // Check if the input is a path or branch name
      // First, get all worktrees
      const worktrees = await worktreeManager.listWorktrees();

      // Check if input matches a worktree path
      const matchingWorktreeByPath = worktrees.find((wt) => wt.path === targetPath);

      if (matchingWorktreeByPath) {
        // Input is a valid worktree path
        targetPath = matchingWorktreeByPath.path;
      } else {
        // Check if it's an existing directory path
        const isAbsolutePath = targetPath.startsWith('/');
        const pathExists = isAbsolutePath && fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory();

        if (!pathExists) {
          // Treat as branch name and search for matching worktree
          const matchingWorktree = worktrees.find((wt) => wt.branch === targetPath);

          if (!matchingWorktree) {
            logger.error(`No worktree found for branch: ${targetPath}`);
            process.exit(1);
          }

          targetPath = matchingWorktree.path;
          logger.info(`Found worktree for branch '${matchingWorktree.branch}': ${targetPath}`);
        }
      }
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
