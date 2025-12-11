#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { deleteCommand } from './commands/delete.js';
import { switchCommand } from './commands/switch.js';
import { pruneCommand } from './commands/prune.js';
import { syncCommand } from './commands/sync.js';
import { setupCommand } from './commands/setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program.name('gwt').description('Git worktree management CLI').version(packageJson.version);

// Add command
program
  .command('add [branch-name]')
  .description('Create a new worktree')
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
  .command('delete [path-or-branch]')
  .alias('rm')
  .description('Delete a worktree by path or branch name')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(async (pathOrBranch, options) => {
    await deleteCommand(pathOrBranch, options);
  });

// Switch command
program
  .command('switch [path-or-branch]')
  .alias('sw')
  .description('Switch to a worktree by path or branch name')
  .action(async (pathOrBranch) => {
    await switchCommand(pathOrBranch);
  });

// Prune command
program
  .command('prune')
  .description(
    'Clean up Git references for manually deleted worktrees (only needed if deleted outside gwt)'
  )
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

// Setup command
program
  .command('setup')
  .description('Install or update shell integration for automatic directory switching')
  .action(async () => {
    await setupCommand();
  });

// Show help if no subcommand provided
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);
