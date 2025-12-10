import inquirer from 'inquirer';
import chalk from 'chalk';
import { GitService } from '../lib/git.js';
import { WorktreeManager } from '../lib/worktree.js';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';
import type { WorktreeInfo, ListAction } from '../types/index.js';
import { deleteCommand } from './delete.js';
import { switchCommand } from './switch.js';

/**
 * List command: Display and manage worktrees interactively
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
    console.log();

    for (const wt of worktrees) {
      displayWorktree(wt);
    }

    console.log();

    // Filter out current worktree for selection
    const selectableWorktrees = worktrees.filter((wt) => !wt.isCurrent);

    if (selectableWorktrees.length === 0) {
      logger.info('No other worktrees to manage');
      return;
    }

    // Select worktree (excluding current)
    const { selectedWorktree } = await inquirer.prompt<{ selectedWorktree: string }>([
      {
        type: 'list',
        name: 'selectedWorktree',
        message: 'Select worktree:',
        choices: selectableWorktrees.map((wt) => ({
          name: formatWorktreeChoice(wt),
          value: wt.path,
        })),
      },
    ]);

    // Build action choices
    const actionChoices: Array<{ name: string; value: ListAction }> = [
      { name: '🔄 Switch to worktree', value: 'switch' },
      { name: '🗑️  Delete worktree', value: 'delete' },
      { name: '❌ Cancel', value: 'cancel' },
    ];

    // Then, select action
    const { action } = await inquirer.prompt<{ action: ListAction }>([
      {
        type: 'list',
        name: 'action',
        message: 'Select action:',
        choices: actionChoices,
      },
    ]);

    if (action === 'cancel') {
      logger.info('Cancelled');
      return;
    }

    // Execute action
    if (action === 'switch') {
      await switchCommand(selectedWorktree);
    } else if (action === 'delete') {
      await deleteCommand(selectedWorktree, { force: false });
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

  console.log(`${icon} ${path} ${branch} ${commit} ${current}`);

  // Display commit message as sub-info
  if (wt.lastCommitMessage) {
    const message = wt.lastCommitMessage.split('\n')[0]; // First line only
    const truncated = message.length > 60 ? message.substring(0, 57) + '...' : message;
    console.log(chalk.gray(`  │ ${truncated}`));
    console.log(); // Add blank line only when there's a commit message
  }
}

/**
 * Format worktree choice for inquirer
 */
function formatWorktreeChoice(wt: WorktreeInfo): string {
  const current = wt.isCurrent ? ' *current*' : '';
  return `${wt.path} (${wt.branch}) [${wt.commit}]${current}`;
}
