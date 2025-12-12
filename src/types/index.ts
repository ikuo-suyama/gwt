/**
 * Git worktree information
 */
export interface WorktreeInfo {
  /** Absolute path to the worktree */
  path: string;
  /** Branch name associated with the worktree */
  branch: string;
  /** Commit hash (short form) */
  commit: string;
  /** Whether this is the current worktree */
  isCurrent: boolean;
  /** Whether the worktree is in detached HEAD state */
  isDetached: boolean;
  /** Whether this is the main worktree (first one, contains .git) */
  isMain: boolean;
  /** Whether the worktree can be pruned (directory deleted manually) */
  isPrunable: boolean;
  /** Last commit message */
  lastCommitMessage?: string;
}

/**
 * Options for creating a worktree
 */
export interface WorktreeOptions {
  /** Branch name for the worktree */
  branchName?: string;
  /** Enable automatic rebase (default: true) */
  autoRebase?: boolean;
  /** Copy .env files (default: true) */
  copyEnv?: boolean;
  /** Override base branch */
  baseBranch?: string;
  /** Custom worktree path */
  customPath?: string;
  /** Branch to create from (default: origin/<baseBranch>) */
  from?: string;
}

/**
 * Options for syncing (rebase) operation
 */
export interface SyncOptions {
  /** Override base branch */
  baseBranch?: string;
}

/**
 * Options for delete operation
 */
export interface DeleteOptions {
  /** Force deletion */
  force?: boolean;
}

/**
 * Git configuration
 */
export interface GitConfig {
  /** Current working directory */
  cwd: string;
}

/**
 * Action types for interactive list
 */
export type ListAction = 'switch' | 'delete' | 'info' | 'cancel';

/**
 * List action result
 */
export interface ListActionResult {
  action: ListAction;
  worktree?: WorktreeInfo;
}
