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

The shell function wraps the `gwt` command and:
1. Captures the output of the command
2. Checks if it's a `switch` command that succeeded
3. If the output is a valid directory path, changes to that directory
4. Otherwise, displays the output normally

This allows `gwt switch` to actually change your shell's current directory, which a standalone binary cannot do.

## Reload Shell

After installation, reload your shell:

```bash
exec $SHELL -l
```

This works for Fish, Bash, and Zsh.
