/**
 * gwt - Git Worktree Manager
 * Main library exports
 */

// Core services
export { GitService } from './lib/git.js';
export { WorktreeManager } from './lib/worktree.js';

// Commands (can be used programmatically)
export { addCommand } from './commands/add.js';
export { listCommand } from './commands/list.js';
export { deleteCommand } from './commands/delete.js';
export { switchCommand } from './commands/switch.js';
export { pruneCommand } from './commands/prune.js';
export { syncCommand } from './commands/sync.js';

// Types
export type {
  WorktreeInfo,
  WorktreeOptions,
  SyncOptions,
  DeleteOptions,
  GitConfig,
  ListAction,
  ListActionResult,
} from './types/index.js';

// Errors
export {
  GwtError,
  GitError,
  WorktreeError,
  ValidationError,
  BranchNotFoundError,
  WorktreeExistsError,
  DetachedHeadError,
} from './utils/errors.js';

// Logger
export { logger } from './utils/logger.js';
