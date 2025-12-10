import chalk from 'chalk';

/**
 * Logger utility with colored output
 */
export const logger = {
  /**
   * Log success message
   */
  success(message: string): void {
    console.log(chalk.green('✅'), message);
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
    console.warn(chalk.yellow('⚠️'), message);
  },

  /**
   * Log info message
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ️'), message);
  },

  /**
   * Log debug message (only in verbose mode)
   */
  debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🐛'), message);
    }
  },

  /**
   * Log step message
   */
  step(message: string): void {
    console.log(chalk.cyan('→'), message);
  },

  /**
   * Log a separator line
   */
  separator(): void {
    console.log(chalk.gray('─'.repeat(50)));
  },

  /**
   * Log a highlighted message
   */
  highlight(message: string): void {
    console.log(chalk.bgCyan.black(` ${message} `));
  },

  /**
   * Log plain message without formatting
   */
  plain(message: string): void {
    console.log(message);
  },
};
