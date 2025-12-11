# Shell Integration for gwt

These shell integration scripts enable `gwt switch` to actually change your current directory.

## Quick Installation (Recommended)

**Method 1: Using gwt command** (easiest):

```bash
gwt setup
```

This will:
- ✅ Automatically detect your shell (Fish, Bash, or Zsh)
- ✅ Check for existing installations and versions
- ✅ Prompt to update if an older version is installed
- ✅ Install or update the shell integration

**Method 2: One-line remote install**:

```bash
curl -fsSL https://raw.githubusercontent.com/ikuo-suyama/gwt/master/shell-integration/install.sh | bash
```

Or using wget:

```bash
wget -qO- https://raw.githubusercontent.com/ikuo-suyama/gwt/master/shell-integration/install.sh | bash
```

The installer will:
- ✅ Automatically detect your shell (Fish, Bash, or Zsh)
- ✅ Check current version and prompt for updates
- ✅ Install or update the appropriate integration
- ✅ Provide clear next steps

After installation, restart your shell:
```bash
exec $SHELL -l
```

## Manual Installation

### Fish Shell

**Recommended: Install to conf.d (keeps config.fish clean)**

```fish
# If installed via npm globally
set -l gwt_path (npm root -g)/gwt/shell-integration/fish.fish
cp "$gwt_path" ~/.config/fish/conf.d/gwt.fish

# Or from local repository
cp shell-integration/fish.fish ~/.config/fish/conf.d/gwt.fish

# Or create a symlink (auto-updates with package)
ln -s "$(pwd)/shell-integration/fish.fish" ~/.config/fish/conf.d/gwt.fish

# Reload shell
exec $SHELL -l
```

**Alternative: Source in config.fish**

Add to your `~/.config/fish/config.fish`:

```fish
source /path/to/gwtree/shell-integration/fish.fish
```

### Bash

Add to your `~/.bashrc`:

```bash
source /path/to/gwtree/shell-integration/bash.sh

# Reload shell
exec $SHELL -l
```

Or copy the function directly - see `bash.sh`.

### Zsh

Add to your `~/.zshrc`:

```zsh
source /path/to/gwtree/shell-integration/zsh.sh

# Reload shell
exec $SHELL -l
```

Or copy the function directly - see `zsh.sh`.

## How It Works

The shell function intelligently wraps the `gwt` command:

**For `gwt add` and `gwt switch` commands:**
1. Connects stdin/stderr to terminal for interactive prompts
2. Captures stdout (the worktree path)
3. If the path is valid, automatically changes directory
4. Displays confirmation message

**Technical details:**
- All log messages go to stderr (not captured)
- Only the final path goes to stdout (captured by shell wrapper)
- Interactive prompts use `/dev/tty` directly
- Works for both interactive and non-interactive usage

**For all other commands:**
- Runs normally without modification
- Full interactive support

This allows `gwt add` and `gwt switch` to change your shell's current directory automatically.

## Reload Shell

After installation, reload your shell:

```bash
exec $SHELL -l
```

This works for Fish, Bash, and Zsh.
