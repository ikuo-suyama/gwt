# Shell Integration for gwt

These shell integration scripts enable `gwt switch` to actually change your current directory.

## Installation

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
