import chalk from 'chalk';
import { GitService } from '../lib/git.js';
import { WorktreeManager } from '../lib/worktree.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';
import type { WorktreeInfo } from '../types/index.js';
import { RemoteSyncStatus } from '../types/index.js';

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
 * Get icon for remote sync status
 */
function getRemoteSyncIcon(status?: RemoteSyncStatus): string {
  if (!status || status === RemoteSyncStatus.NO_REMOTE) return '';

  switch (status) {
    case RemoteSyncStatus.SYNCED:
      return chalk.green('⟳'); // Synced with remote
    case RemoteSyncStatus.AHEAD:
      return chalk.yellow('↑'); // Need to push
    case RemoteSyncStatus.BEHIND:
      return chalk.blue('↓'); // Need to pull
    case RemoteSyncStatus.DIVERGED:
      return chalk.red('↕'); // Diverged
    default:
      return '';
  }
}

/**
 * Get icon for changes status
 */
function getChangesIcon(hasChanges?: boolean): string {
  if (hasChanges === undefined) return '';
  return hasChanges ? chalk.yellow('●') : chalk.green('✓');
}

/**
 * Display a single worktree with formatting
 */
function displayWorktree(wt: WorktreeInfo): void {
  const icon = wt.isCurrent ? chalk.green('➤') : ' ';
  const path = chalk.cyan(wt.path);
  const branch = chalk.green(`(${wt.branch})`);
  const commit = chalk.yellow(`[${wt.commit}]`);

  // Status badges
  const current = wt.isCurrent ? chalk.bgGreen.black(' *current* ') : '';
  const main = wt.isMain ? chalk.bgBlue.white(' *main* ') : '';
  const prunable = wt.isPrunable ? chalk.bgRed.white(' *prunable* ') : '';

  // NEW: Status icons
  const changesIcon = getChangesIcon(wt.hasChanges);
  const syncIcon = getRemoteSyncIcon(wt.remoteSyncStatus);
  const statusIcons = [changesIcon, syncIcon].filter((s) => s).join(' ');

  console.error(`${icon} ${path} ${branch} ${commit} ${statusIcons} ${current}${main}${prunable}`);

  // Display commit message with relative time
  if (wt.lastCommitMessage) {
    const message = wt.lastCommitMessage.split('\n')[0]; // First line only
    const truncated = message.length > 60 ? message.substring(0, 57) + '...' : message;

    // NEW: Include relative time
    const relativeTime = wt.lastCommitDateRelative
      ? chalk.gray(` (${wt.lastCommitDateRelative})`)
      : '';

    console.error(chalk.gray(`    │ ${truncated}${relativeTime}`));
  }

  // Display prunable hint
  if (wt.isPrunable) {
    console.error(chalk.red(`    │ Directory deleted manually. Run 'gwt prune' to clean up.`));
  }
}
