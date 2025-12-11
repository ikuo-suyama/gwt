import { describe, it, expect } from 'vitest';
import { execaNode } from 'execa';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI', () => {
  describe('version command', () => {
    it('should display version from package.json', async () => {
      const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

      const { stdout } = await execaNode(join(__dirname, '../dist/cli.js'), ['-V']);

      expect(stdout.trim()).toBe(packageJson.version);
    });

    it('should display version with --version flag', async () => {
      const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

      const { stdout } = await execaNode(join(__dirname, '../dist/cli.js'), ['--version']);

      expect(stdout.trim()).toBe(packageJson.version);
    });
  });

  describe('help command', () => {
    it('should display help when no arguments provided', async () => {
      const { stdout } = await execaNode(join(__dirname, '../dist/cli.js'), []);

      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('gwt');
      expect(stdout).toContain('Commands:');
    });

    it('should display help with --help flag', async () => {
      const { stdout } = await execaNode(join(__dirname, '../dist/cli.js'), ['--help']);

      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('gwt');
      expect(stdout).toContain('Commands:');
    });

    it('should list available commands', async () => {
      const { stdout } = await execaNode(join(__dirname, '../dist/cli.js'), ['--help']);

      expect(stdout).toContain('add');
      expect(stdout).toContain('list');
      expect(stdout).toContain('delete');
      expect(stdout).toContain('switch');
      expect(stdout).toContain('prune');
      expect(stdout).toContain('sync');
    });
  });
});
