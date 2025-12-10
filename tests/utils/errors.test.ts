import { describe, it, expect } from 'vitest';
import {
  GwtError,
  GitError,
  WorktreeError,
  ValidationError,
  BranchNotFoundError,
  WorktreeExistsError,
  DetachedHeadError,
} from '../../src/utils/errors';

describe('Error Classes', () => {
  describe('GwtError', () => {
    it('should create a GwtError with message', () => {
      const error = new GwtError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GwtError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('GwtError');
    });

    it('should capture stack trace', () => {
      const error = new GwtError('Test error');
      expect(error.stack).toBeDefined();
    });
  });

  describe('GitError', () => {
    it('should create a GitError with message', () => {
      const error = new GitError('Git operation failed');
      expect(error).toBeInstanceOf(GwtError);
      expect(error).toBeInstanceOf(GitError);
      expect(error.message).toBe('Git operation failed');
      expect(error.name).toBe('GitError');
    });

    it('should store command when provided', () => {
      const error = new GitError('Git operation failed', 'git pull');
      expect(error.command).toBe('git pull');
    });

    it('should work without command', () => {
      const error = new GitError('Git operation failed');
      expect(error.command).toBeUndefined();
    });
  });

  describe('WorktreeError', () => {
    it('should create a WorktreeError with message', () => {
      const error = new WorktreeError('Worktree operation failed');
      expect(error).toBeInstanceOf(GwtError);
      expect(error).toBeInstanceOf(WorktreeError);
      expect(error.message).toBe('Worktree operation failed');
      expect(error.name).toBe('WorktreeError');
    });

    it('should store path when provided', () => {
      const error = new WorktreeError('Worktree operation failed', '/path/to/worktree');
      expect(error.path).toBe('/path/to/worktree');
    });

    it('should work without path', () => {
      const error = new WorktreeError('Worktree operation failed');
      expect(error.path).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with message', () => {
      const error = new ValidationError('Validation failed');
      expect(error).toBeInstanceOf(GwtError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('ValidationError');
    });

    it('should store field when provided', () => {
      const error = new ValidationError('Validation failed', 'branchName');
      expect(error.field).toBe('branchName');
    });

    it('should work without field', () => {
      const error = new ValidationError('Validation failed');
      expect(error.field).toBeUndefined();
    });
  });

  describe('BranchNotFoundError', () => {
    it('should create a BranchNotFoundError with branch name', () => {
      const error = new BranchNotFoundError('feature/test');
      expect(error).toBeInstanceOf(GitError);
      expect(error).toBeInstanceOf(BranchNotFoundError);
      expect(error.message).toBe('Branch not found: feature/test');
      expect(error.name).toBe('BranchNotFoundError');
    });
  });

  describe('WorktreeExistsError', () => {
    it('should create a WorktreeExistsError with path', () => {
      const error = new WorktreeExistsError('/path/to/worktree');
      expect(error).toBeInstanceOf(WorktreeError);
      expect(error).toBeInstanceOf(WorktreeExistsError);
      expect(error.message).toBe('Worktree already exists: /path/to/worktree');
      expect(error.name).toBe('WorktreeExistsError');
      expect(error.path).toBe('/path/to/worktree');
    });
  });

  describe('DetachedHeadError', () => {
    it('should create a DetachedHeadError with default message', () => {
      const error = new DetachedHeadError();
      expect(error).toBeInstanceOf(GitError);
      expect(error).toBeInstanceOf(DetachedHeadError);
      expect(error.message).toBe('Cannot perform this operation in detached HEAD state');
      expect(error.name).toBe('DetachedHeadError');
    });
  });
});
