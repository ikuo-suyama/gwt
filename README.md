# gwt - Git Worktree Manager

[![CI](https://github.com/ikuo-suyama/gwt/workflows/CI/badge.svg)](https://github.com/ikuo-suyama/gwt/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/ikuo-suyama/gwt/branch/master/graph/badge.svg)](https://codecov.io/gh/ikuo-suyama/gwt)
[![npm version](https://img.shields.io/npm/v/@ikuo-suyama/gwt.svg)](https://www.npmjs.com/package/@ikuo-suyama/gwt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@ikuo-suyama/gwt.svg)](https://nodejs.org)

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

Create a worktree for a new or existing branch. By default, new branches start from origin/develop and are automatically rebased to latest. With shell integration, you'll be automatically moved to the new worktree:

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

# Create branch from current branch instead of origin/develop
gwt add feature/auth --from HEAD

# Create branch from specific branch
gwt add feature/auth --from main

# Create branch from remote branch
gwt add feature/auth --from origin/staging
```

**Note**:
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

# Switch to specific worktree by path
gwt switch /path/to/worktree

# Switch to worktree by branch name
gwt switch feature/auth
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

Clean up Git's internal references when worktree directories were manually deleted:

```bash
gwt prune
```

**When to use**: Only needed if you deleted worktree directories manually (e.g., `rm -rf`, file manager, etc.). If you use `gwt delete`, cleanup is automatic.

**Example scenario**:
```bash
# Manually delete a worktree directory
rm -rf ../gwtree-feature

# Git still thinks it exists
git worktree list
# → /path/to/gwtree-feature (feature) [abc123] prunable

# Clean up the reference
gwt prune
# → Cleaned up references for deleted worktrees

# Now it's gone from the list
git worktree list
# → Only remaining worktrees
```

## Shell Integration

For `gwt switch` to actually change your current directory, you need to add a shell function wrapper.

### Quick Install (Recommended)

**Using gwt command** (easiest - included with gwt):

```bash
gwt setup
```

This will:
- ✅ Automatically detect your shell (Fish, Bash, or Zsh)
- ✅ Check for existing installations
- ✅ Prompt to update if an older version is installed
- ✅ Install or update the shell integration

**Or using one-line remote install**:

```bash
curl -fsSL https://raw.githubusercontent.com/ikuo-suyama/gwt/master/shell-integration/install.sh | bash
```

Or using wget:
```bash
wget -qO- https://raw.githubusercontent.com/ikuo-suyama/gwt/master/shell-integration/install.sh | bash
```

Then restart your shell:
```bash
exec $SHELL -l
```

### Manual Install

Shell integration scripts are provided in the [`shell-integration/`](shell-integration/) directory:

- **Fish**: [`shell-integration/fish.fish`](shell-integration/fish.fish)
- **Bash**: [`shell-integration/bash.sh`](shell-integration/bash.sh)
- **Zsh**: [`shell-integration/zsh.sh`](shell-integration/zsh.sh)

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

1. Creates the new branch (from origin/base-branch by default, or from `--from` if specified)
2. Fetches latest changes from remote
3. Rebases directly onto origin/base-branch

This ensures your new worktree starts with the latest code. Use `--from HEAD` to branch from your current work instead of the base branch.

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

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Development workflow and testing
- Code quality standards and CI checks
- Commit message conventions
- Pull request process
- Issue reporting guidelines

**Quick Start**:
```bash
git clone https://github.com/YOUR_USERNAME/gwt.git
cd gwt
npm install
npm test  # Ensure all tests pass
```

**Before submitting a PR**, make sure:
- ✅ All tests pass with ≥80% coverage
- ✅ Linting and formatting checks pass
- ✅ CI checks are green

## Requirements

- Node.js >= 20.0.0
- Git >= 2.15.0 (for worktree support)

## License

MIT License - see [LICENSE.md](LICENSE.md) for details

## Credits

Originally inspired by the Fish shell `gwtree` function.

## Contributors

Thanks to all the people who have contributed to this project!

<a href="https://github.com/ikuo-suyama/gwt/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ikuo-suyama/gwt" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Support

- 🐛 [Report bugs](https://github.com/ikuo-suyama/gwt/issues)
- 💡 [Request features](https://github.com/ikuo-suyama/gwt/issues)
- 📖 [Read the docs](https://github.com/ikuo-suyama/gwt)

---

Made with ❤️ by the gwt team
