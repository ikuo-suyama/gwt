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

    // Build choices with actions for each worktree
    const choices: Array<{ name: string; value: string }> = [];

    for (const wt of worktrees) {
      // Skip current worktree (can't switch to or delete current)
      if (wt.isCurrent) {
        continue;
      }

      const wtInfo = `${chalk.cyan(wt.path)} ${chalk.green(`(${wt.branch})`)} ${chalk.yellow(
        `[${wt.commit}]`
      )}`;

      choices.push({
        name: `  🔄 Switch to: ${wtInfo}`,
        value: `switch:${wt.path}`,
      });
      choices.push({
        name: `  🗑️  Delete:    ${wtInfo}`,
        value: `delete:${wt.path}`,
      });
    }

    if (choices.length === 0) {
      logger.info('No other worktrees to manage');
      return;
    }

    choices.push({ name: chalk.gray('\n❌ Cancel'), value: 'cancel' });

    // Select action and worktree in one step
    const { selection } = await inquirer.prompt<{ selection: string }>([
      {
        type: 'list',
        name: 'selection',
        message: 'Select action:',
        choices,
        pageSize: 15,
      },
    ]);

    if (selection === 'cancel') {
      logger.info('Cancelled');
      return;
    }

    // Parse selection
    const [action, worktreePath] = selection.split(':');

    // Execute action
    if (action === 'switch') {
      await switchCommand(worktreePath);
    } else if (action === 'delete') {
      await deleteCommand(worktreePath, { force: false });
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
  }

  console.log();
}

/**
 * Format worktree choice for inquirer
 */
function formatWorktreeChoice(wt: WorktreeInfo): string {
  const current = wt.isCurrent ? ' *current*' : '';
  return `${wt.path} (${wt.branch}) [${wt.commit}]${current}`;
}
