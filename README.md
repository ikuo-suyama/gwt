# gwt - Git Worktree Manager

A powerful CLI tool for managing Git worktrees with ease. Simplify your multi-branch workflow with intuitive commands and interactive interfaces.

## Features

- 🌳 **Easy Worktree Creation** - Create worktrees with a single command
- 🔄 **Auto-Rebase** - Automatically rebase new worktrees to the latest base branch
- 📋 **Interactive List** - Browse and manage worktrees with an interactive UI
- 🎯 **Smart Branch Detection** - Automatically detects default branch and base branch
- 📦 **Environment File Copying** - Automatically copy .env files to new worktrees
- ⚡ **Fast Switching** - Quickly switch between worktrees
- 🧹 **Cleanup Tools** - Prune and delete worktrees easily

## Installation

### Global Installation

```bash
npm install -g gwt
```

### Local Installation

```bash
npm install gwt
```

### Using npx (No Installation Required)

```bash
npx gwt add feature/new-feature
```

## Usage

### Create a New Worktree

Create a worktree for a new or existing branch. With shell integration, you'll be automatically moved to the new worktree:

```bash
# Create worktree with branch name (auto cd to new worktree)
gwt add feature/auth

# Create worktree using current branch
gwt add

# Create worktree without auto-rebase
gwt add feature/auth --no-rebase

# Create worktree without copying .env files
gwt add feature/auth --no-env

# Specify custom base branch
gwt add feature/auth --base develop

# Specify custom worktree path
gwt add feature/auth --path /path/to/worktree
```

**Note**:
- You must use the `add` subcommand explicitly. Running `gwt` without a subcommand shows help.
- With shell integration installed, `gwt add` automatically changes to the new worktree directory.

### List Worktrees

Display all worktrees:

```bash
gwt list
# or
gwt ls
```

This shows all worktrees with their paths, branches, commits, and status.

### Delete a Worktree

```bash
# Delete with interactive selection
gwt delete
# or
gwt rm

# Delete by path
gwt delete /path/to/worktree

# Delete by branch name
gwt delete feature/auth

# Force delete (skip confirmation)
gwt delete feature/auth --force
# or
gwt delete feature/auth -f
```

**Note**: The main worktree (original repository without suffix) cannot be deleted.

### Switch to a Worktree

```bash
# Switch with interactive selection
gwt switch
# or
gwt sw

# Switch to specific worktree
gwt switch /path/to/worktree
```

**Note**: For directory switching to work, add shell integration (see below).

### Sync Current Branch

Rebase current branch to the latest base branch:

```bash
gwt sync

# Specify custom base branch
gwt sync --base develop
```

### Cleanup Worktrees

Remove references to deleted worktrees:

```bash
gwt prune
```

## Shell Integration

For `gwt switch` to actually change your current directory, you need to add a shell function wrapper.

Shell integration scripts are provided in the [`shell-integration/`](shell-integration/) directory:

- **Fish**: [`shell-integration/fish.fish`](shell-integration/fish.fish)
- **Bash**: [`shell-integration/bash.sh`](shell-integration/bash.sh)
- **Zsh**: [`shell-integration/zsh.sh`](shell-integration/zsh.sh)

### Quick Install

**Fish (Recommended: use conf.d to keep config.fish clean)**
```fish
# Copy to conf.d directory (auto-loaded by Fish)
cp shell-integration/fish.fish ~/.config/fish/conf.d/gwt.fish
exec $SHELL -l
```

**Bash**
```bash
echo "source $(pwd)/shell-integration/bash.sh" >> ~/.bashrc
exec $SHELL -l
```

**Zsh**
```zsh
echo "source $(pwd)/shell-integration/zsh.sh" >> ~/.zshrc
exec $SHELL -l
```

See [`shell-integration/README.md`](shell-integration/README.md) for more details.

## How It Works

### Worktree Path Convention

When creating a worktree, `gwt` follows this naming convention:

```
../<current-dir>-<safe-branch-name>
```

For example:
- Current directory: `myproject`
- Branch: `feature/auth`
- Worktree path: `../myproject-feature-auth`

### Branch Detection

`gwt` automatically detects branches in this order:

1. **Default Branch**: Fetches from `git remote` (typically `main` or `master`)
2. **Base Branch**: Searches for `develop` → `master` → `main`
3. **Current Branch**: Uses current branch if no branch name provided

### Auto-Rebase

When creating a worktree with auto-rebase enabled (default), `gwt`:

1. Checks out the base branch
2. Pulls the latest changes
3. Checks out your branch
4. Rebases onto the base branch

This ensures your new worktree starts with the latest code.

### Environment File Copying

By default, `gwt` copies these files from the source worktree:

- `.env`
- `.env.local`
- `.env.development`

You can disable this with the `--no-env` flag.

## Examples

### Basic Workflow

```bash
# Start working on a new feature
gwt add feature/user-profile

# Your worktree is created, .env is copied, and branch is rebased
# You're now in: ../myproject-feature-user-profile

# Work on your feature...
git add .
git commit -m "Add user profile page"

# Switch back to main worktree
gwt switch
# Select from interactive list

# Clean up when done
gwt delete
# Select the worktree to delete
```

### Working with Multiple Features

```bash
# Create worktrees for multiple features
gwt add feature/auth
gwt add feature/payments
gwt add bugfix/login-error

# List all worktrees
gwt list

# Switch between them as needed
gwt switch  # Interactive selection

# Sync any worktree with latest base
cd ../myproject-feature-auth
gwt sync
```

### Advanced Usage

```bash
# Create worktree with custom settings
gwt add feature/advanced \
  --no-rebase \
  --no-env \
  --base develop \
  --path /custom/path/to/worktree

# Force delete a locked worktree
gwt delete /path/to/worktree --force

# Clean up after deleting worktrees manually
gwt prune
```

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/ikuo-suyama/gwt.git
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

### Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

### Testing

We maintain high test coverage. Please ensure:

- All new features have unit tests
- Integration tests cover command interactions
- E2E tests verify CLI behavior

```bash
# Run all tests
npm test

# Run specific test file
npm test -- git.test.ts

# Run tests with coverage
npm run test:coverage
```

### Code Style

We use ESLint and Prettier for code quality:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Commit Guidelines

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
test: Add tests
refactor: Refactor code
chore: Update dependencies
```

### Pull Request Process

1. Update documentation for any new features
2. Add tests for new functionality
3. Ensure all tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Update CHANGELOG.md with your changes
6. Submit PR with clear description of changes

### Reporting Issues

When reporting issues, please include:

- Operating system and version
- Node.js version
- `gwt` version
- Steps to reproduce
- Expected vs actual behavior
- Relevant error messages or logs

## Requirements

- Node.js >= 18.0.0
- Git >= 2.15.0 (for worktree support)

## License

MIT License - see [LICENSE.md](LICENSE.md) for details

## Credits

Originally inspired by the Fish shell `gwtree` function.

## Support

- 🐛 [Report bugs](https://github.com/ikuo-suyama/gwt/issues)
- 💡 [Request features](https://github.com/ikuo-suyama/gwt/issues)
- 📖 [Read the docs](https://github.com/ikuo-suyama/gwt)

---

Made with ❤️ by the gwt team
