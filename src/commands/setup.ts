import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';
import { GwtError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Setup command: Install shell integration by running install.sh
 *
 * This command delegates to the shell-integration/install.sh script which:
 * - Detects the current shell (Fish, Bash, Zsh)
 * - Checks for existing installations
 * - Prompts for overwrite if already installed
 * - Installs the shell integration
 */
export async function setupCommand(): Promise<void> {
  try {
    logger.highlight('gwt Shell Integration Setup');

    // Find install.sh in shell-integration directory
    // After npm install: node_modules/@ikuo-suyama/gwt/shell-integration/install.sh
    // From dist: dist/commands/setup.js -> ../../shell-integration/install.sh
    const installScriptPath = join(__dirname, '../../shell-integration/install.sh');

    if (!existsSync(installScriptPath)) {
      throw new GwtError(
        `Installation script not found: ${installScriptPath}\n` +
          'This might be a packaging issue. Please report this bug at:\n' +
          'https://github.com/ikuo-suyama/gwt/issues'
      );
    }

    logger.info('Running shell integration installer...');
    logger.separator();

    // Execute install.sh with full TTY support
    const result = spawnSync('bash', [installScriptPath], {
      stdio: 'inherit', // Pass through stdin/stdout/stderr for interactive prompts
      cwd: process.cwd(),
    });

    if (result.error) {
      throw new GwtError(`Failed to run installer: ${result.error.message}`);
    }

    if (result.status !== 0) {
      throw new GwtError(`Installer exited with code ${result.status}`);
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
