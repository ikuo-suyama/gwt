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

**For `gwt switch <path>` (with path argument):**
1. Captures the output of the command
2. Checks if it's a valid directory path
3. Changes to that directory
4. Displays confirmation message

**For `gwt switch` (no path, interactive):**
- Runs the command normally without capturing output
- Allows inquirer prompts to work correctly
- After selection, the path is output and captured

**For all other commands:**
- Runs normally without output capture
- Full interactive support (prompts, colors, etc.)

This allows `gwt switch` to change your shell's current directory while maintaining full support for interactive prompts.

## Reload Shell

After installation, reload your shell:

```bash
exec $SHELL -l
```

This works for Fish, Bash, and Zsh.
