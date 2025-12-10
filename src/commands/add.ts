import type { WorktreeOptions } from '../types/index.js';
import { GitService } from '../lib/git.js';
import { WorktreeManager } from '../lib/worktree.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';

interface AddCommandOptions {
  rebase?: boolean;
  env?: boolean;
  base?: string;
  path?: string;
}

/**
 * Add command: Create a new worktree
 */
export async function addCommand(
  branchName: string | undefined,
  cmdOptions: AddCommandOptions
): Promise<void> {
  try {
    logger.highlight('Creating Git Worktree');

    const gitService = new GitService({ cwd: process.cwd() });
    const worktreeManager = new WorktreeManager(gitService);

    const options: WorktreeOptions = {
      branchName,
      autoRebase: cmdOptions.rebase !== false, // Default true
      copyEnv: cmdOptions.env !== false, // Default true
      baseBranch: cmdOptions.base,
      customPath: cmdOptions.path,
    };

    const worktreePath = await worktreeManager.createWorktree(options);

    logger.separator();
    logger.success('Worktree is ready!');
    logger.plain(`📂 Path: ${worktreePath}`);
    logger.plain(`🌿 Branch: ${options.branchName || '(current branch)'}`);
    logger.separator();
    logger.info('To switch to the worktree, run:');
    logger.plain(`  cd ${worktreePath}`);
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
