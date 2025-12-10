# Contributing to gwt

We welcome contributions! This guide will help you get started with contributing to gwt.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gwt.git
   cd gwt
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Project

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch
```

### Code Quality

We use ESLint and Prettier to maintain code quality:

```bash
# Check linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Check formatting (without modifying files)
npm run format:check
```

**Pre-commit Hooks**: Linting and formatting run automatically on staged files when you commit. If they fail, your commit will be blocked until issues are fixed.

### Testing

We maintain high test coverage (≥80%). All new features must include tests.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

#### Test Coverage Requirements

- **Minimum Coverage**: 80% for all metrics (lines, functions, branches, statements)
- **Test Files Location**: `tests/` directory, matching source structure
  - `src/lib/git.ts` → `tests/lib/git.test.ts`
  - `src/utils/logger.ts` → `tests/utils/logger.test.ts`

#### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { MyClass } from '../../src/lib/my-class';

describe('MyClass', () => {
  it('should do something', () => {
    const instance = new MyClass();
    expect(instance.doSomething()).toBe(true);
  });
});
```

## Continuous Integration (CI)

Our CI pipeline runs on every push and pull request to ensure code quality.

### CI Checks

All checks must pass before a PR can be merged:

1. **Lint** (~20s)
   - ESLint: Code quality checks
   - Prettier: Code formatting verification

2. **Test** (~25s)
   - Executes all unit tests (60 tests)
   - Generates coverage reports
   - **Enforces 80% coverage threshold**
   - ❌ **CI fails if coverage < 80%**

3. **Build** (~20s)
   - TypeScript compilation
   - Artifact generation

### Viewing CI Results

- **In PR**: Check status at the bottom of your PR page
- **Actions Tab**: https://github.com/ikuo-suyama/gwt/actions
- **Local**: Run the same checks locally before pushing:
  ```bash
  npm run lint
  npm run test:coverage
  npm run build
  ```

### Coverage Threshold Enforcement

Coverage threshold is strictly enforced. If coverage drops below 80%, tests will fail:

```bash
# This will fail if coverage < 80%
npm run test:coverage

# Example failure output:
ERROR: Coverage for lines (75%) does not meet global threshold (80%)
```

**Before submitting a PR**:
1. Run `npm run test:coverage` locally
2. Verify all metrics are ≥ 80%
3. Add more tests if needed to meet the threshold

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `style`: Code style changes (formatting, etc.)
- `chore`: Maintenance tasks (dependencies, build, etc.)
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```bash
feat: Add support for custom worktree paths

fix: Resolve issue with detached HEAD detection

docs: Update installation instructions

test: Add unit tests for git service

refactor: Simplify worktree path computation

chore: Update dependencies to latest versions
```

## Pull Request Process

1. **Create a feature branch** from `master`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Run all checks locally**
   ```bash
   npm run lint
   npm run test:coverage  # Must show ≥80% coverage
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add your feature"
   ```
   Pre-commit hooks will automatically run linting and formatting.

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - **PR Title**: Follow Conventional Commits format (same as commit messages)
     ```
     feat: Add support for custom worktree paths
     fix: Resolve issue with detached HEAD detection
     ```
   - **PR Description**: Include clear explanation of changes
     - What problem does this solve?
     - What changes were made?
     - How to test?
     - Any breaking changes?
   - Reference any related issues (e.g., `Closes #123`)
   - Ensure all CI checks pass
   - Wait for review

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added for new functionality
- [ ] All tests pass (`npm test`)
- [ ] Coverage ≥ 80% (`npm run test:coverage`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventional commits
- [ ] **PR title follows conventional commits format**
- [ ] **PR description is clear and complete**
- [ ] CI checks pass

## Reporting Issues

When reporting bugs or requesting features, please include:

### For Bugs

- **Environment**:
  - Operating system and version (e.g., macOS 14.0, Ubuntu 22.04)
  - Node.js version (`node --version`)
  - gwt version (`gwt --version` or `npm list gwt`)
  - Git version (`git --version`)

- **Steps to Reproduce**:
  1. Clear, numbered steps
  2. Include commands and expected vs actual output
  3. Minimal reproducible example if possible

- **Error Messages**:
  - Complete error output
  - Stack traces (if applicable)
  - Screenshots (if UI-related)

### For Features

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: What alternatives have you considered?
- **Additional Context**: Any other relevant information

## Project Structure

```
gwt/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Export index
│   ├── commands/           # Command implementations
│   │   ├── add.ts
│   │   ├── delete.ts
│   │   ├── list.ts
│   │   ├── prune.ts
│   │   ├── switch.ts
│   │   └── sync.ts
│   ├── lib/                # Core business logic
│   │   ├── git.ts         # Git operations
│   │   └── worktree.ts    # Worktree management
│   ├── utils/              # Utilities
│   │   ├── errors.ts      # Error classes
│   │   └── logger.ts      # Logging utilities
│   └── types/              # TypeScript type definitions
│       └── index.ts
├── tests/                  # Unit tests
│   ├── lib/
│   └── utils/
├── shell-integration/      # Shell wrapper scripts
├── .github/
│   └── workflows/
│       └── ci.yml         # CI/CD pipeline
├── package.json
├── tsconfig.json
├── vitest.config.ts       # Test configuration
├── .eslintrc.cjs          # ESLint configuration
├── .prettierrc            # Prettier configuration
└── README.md
```

## Recognition

We use [All Contributors](https://allcontributors.org/) to recognize all contributors, including those who don't commit code. If you've contributed to this project, you can be added by commenting on an issue or PR:

```
@all-contributors please add @username for code, test, doc
```

Contribution types include: code, test, doc, design, infra, translation, and more!

## Need Help?

- 📖 Check existing issues and PRs first
- 💬 Open a [GitHub Discussion](https://github.com/ikuo-suyama/gwt/discussions)
- 🐛 Report bugs via [GitHub Issues](https://github.com/ikuo-suyama/gwt/issues)
- 📧 Contact maintainers (see package.json)

## License

By contributing to gwt, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to gwt! 🙏
