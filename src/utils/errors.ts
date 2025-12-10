/**
 * Base error class for gwt
 */
export class GwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GwtError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error related to Git operations
 */
export class GitError extends GwtError {
  constructor(
    message: string,
    public command?: string
  ) {
    super(message);
    this.name = 'GitError';
  }
}

/**
 * Error related to worktree operations
 */
export class WorktreeError extends GwtError {
  constructor(
    message: string,
    public path?: string
  ) {
    super(message);
    this.name = 'WorktreeError';
  }
}

/**
 * Error related to input validation
 */
export class ValidationError extends GwtError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error when branch is not found
 */
export class BranchNotFoundError extends GitError {
  constructor(branchName: string) {
    super(`Branch not found: ${branchName}`);
    this.name = 'BranchNotFoundError';
  }
}

/**
 * Error when worktree already exists
 */
export class WorktreeExistsError extends WorktreeError {
  constructor(path: string) {
    super(`Worktree already exists: ${path}`, path);
    this.name = 'WorktreeExistsError';
  }
}

/**
 * Error when in detached HEAD state
 */
export class DetachedHeadError extends GitError {
  constructor() {
    super('Cannot perform this operation in detached HEAD state');
    this.name = 'DetachedHeadError';
  }
}
