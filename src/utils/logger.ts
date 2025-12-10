import chalk from 'chalk';

/**
 * Logger utility with colored output
 * All output goes to stderr to keep stdout clean for shell integration
 */
export const logger = {
  /**
   * Log success message
   */
  success(message: string): void {
    console.error(chalk.green('✅'), message);
  },

  /**
   * Log error message
   */
  error(message: string): void {
    console.error(chalk.red('❌'), message);
  },

  /**
   * Log warning message
   */
  warn(message: string): void {
    console.error(chalk.yellow('⚠️'), message);
  },

  /**
   * Log info message
   */
  info(message: string): void {
    console.error(chalk.blue('ℹ️'), message);
  },

  /**
   * Log debug message (only in verbose mode)
   */
  debug(message: string): void {
    if (process.env.DEBUG) {
      console.error(chalk.gray('🐛'), message);
    }
  },

  /**
   * Log step message
   */
  step(message: string): void {
    console.error(chalk.cyan('→'), message);
  },

  /**
   * Log a separator line
   */
  separator(): void {
    console.error(chalk.gray('─'.repeat(50)));
  },

  /**
   * Log a highlighted message
   */
  highlight(message: string): void {
    console.error(chalk.bgCyan.black(` ${message} `));
  },

  /**
   * Log plain message without formatting
   */
  plain(message: string): void {
    console.error(message);
  },
};
