import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../src/utils/logger';

describe('Logger', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete process.env.DEBUG;
  });

  describe('success', () => {
    it('should log success message to stderr', () => {
      logger.success('Operation succeeded');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅'),
        'Operation succeeded'
      );
    });
  });

  describe('error', () => {
    it('should log error message to stderr', () => {
      logger.error('Operation failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌'),
        'Operation failed'
      );
    });
  });

  describe('warn', () => {
    it('should log warning message to stderr', () => {
      logger.warn('Warning message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️'),
        'Warning message'
      );
    });
  });

  describe('info', () => {
    it('should log info message to stderr', () => {
      logger.info('Info message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ️'), 'Info message');
    });
  });

  describe('debug', () => {
    it('should not log debug message when DEBUG is not set', () => {
      logger.debug('Debug message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log debug message when DEBUG is set', () => {
      process.env.DEBUG = 'true';
      logger.debug('Debug message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('🐛'), 'Debug message');
    });
  });

  describe('step', () => {
    it('should log step message to stderr', () => {
      logger.step('Step message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('→'), 'Step message');
    });
  });

  describe('separator', () => {
    it('should log separator line to stderr', () => {
      logger.separator();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('─'));
    });
  });

  describe('highlight', () => {
    it('should log highlighted message to stderr', () => {
      logger.highlight('Important');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Important'));
    });
  });

  describe('plain', () => {
    it('should log plain message to stderr', () => {
      logger.plain('Plain message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Plain message');
    });
  });
});
