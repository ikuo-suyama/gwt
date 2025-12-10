import { GitService } from '../lib/git.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';

/**
 * Prune command: Clean up removed worktrees
 */
export async function pruneCommand(): Promise<void> {
  try {
    logger.step('Checking for manually deleted worktrees...');

    const gitService = new GitService({ cwd: process.cwd() });
    const output = await gitService.pruneWorktrees();

    if (output.trim()) {
      logger.success('Cleaned up references for deleted worktrees:');
      console.error(output);
    } else {
      logger.success('All worktrees are in sync');
      logger.info(
        'No cleanup needed (prune only removes references to manually deleted worktrees)'
      );
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
