import { GitService } from '../lib/git.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';

/**
 * Prune command: Clean up removed worktrees
 */
export async function pruneCommand(): Promise<void> {
  try {
    logger.step('Pruning worktrees...');

    const gitService = new GitService({ cwd: process.cwd() });
    const output = await gitService.pruneWorktrees();

    if (output.trim()) {
      logger.success('Pruned worktrees:');
      console.log(output);
    } else {
      logger.info('No worktrees to prune');
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
