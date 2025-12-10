import type { SyncOptions } from '../types/index.js';
import { GitService } from '../lib/git.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';

/**
 * Sync command: Rebase current branch to base branch
 */
export async function syncCommand(options: SyncOptions): Promise<void> {
  try {
    logger.highlight('Syncing Worktree');

    const gitService = new GitService({ cwd: process.cwd() });

    // Get current branch
    const currentBranch = await gitService.getCurrentBranch();
    logger.info(`Current branch: ${currentBranch}`);

    // Get base branch
    const baseBranch = options.baseBranch || (await gitService.getBaseBranch());
    logger.info(`Base branch: ${baseBranch}`);

    // Perform rebase
    logger.step('Rebasing to latest base branch...');
    await gitService.rebaseToBase(baseBranch);

    logger.success('Sync completed!');
    logger.info(`Branch ${currentBranch} is now up to date with ${baseBranch}`);
  } catch (error) {
    if (error instanceof GwtError) {
      logger.error(error.message);
      logger.warn('You may need to resolve conflicts manually');
      if (process.env.DEBUG && error.stack) {
        logger.debug(error.stack);
      }
      process.exit(1);
    }
    throw error;
  }
}
