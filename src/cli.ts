#!/usr/bin/env node

import { Command } from 'commander';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { deleteCommand } from './commands/delete.js';
import { switchCommand } from './commands/switch.js';
import { pruneCommand } from './commands/prune.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('gwt')
  .description('Git worktree management CLI')
  .version('1.0.0');

// Default command: add
program
  .argument('[branch-name]', 'Branch name for worktree (uses current branch if omitted)')
  .option('--no-rebase', 'Skip automatic rebase')
  .option('--no-env', 'Skip .env file copying')
  .option('--base <branch>', 'Override base branch')
  .option('--path <path>', 'Custom worktree path')
  .action(async (branchName, options) => {
    await addCommand(branchName, options);
  });

// List command
program
  .command('list')
  .alias('ls')
  .description('List all worktrees')
  .action(async () => {
    await listCommand();
  });

// Delete command
program
  .command('delete [path]')
  .alias('rm')
  .description('Delete a worktree')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(async (path, options) => {
    await deleteCommand(path, options);
  });

// Switch command
program
  .command('switch [path]')
  .alias('sw')
  .description('Switch to a worktree')
  .action(async (path) => {
    await switchCommand(path);
  });

// Prune command
program
  .command('prune')
  .description('Clean up removed worktrees')
  .action(async () => {
    await pruneCommand();
  });

// Sync command
program
  .command('sync')
  .description('Rebase current branch to base branch')
  .option('--base <branch>', 'Override base branch')
  .action(async (options) => {
    await syncCommand(options);
  });

program.parse(process.argv);
