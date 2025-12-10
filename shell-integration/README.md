# Shell Integration for gwt

These shell integration scripts enable `gwt switch` to actually change your current directory.

## Installation

### Fish Shell

Add to your `~/.config/fish/config.fish`:

```fish
source /path/to/gwtree/shell-integration/fish.fish
```

Or copy the function directly:

```fish
function gwt
    set -l output (command gwt $argv)
    set -l exit_code $status

    if test $exit_code -eq 0 -a "$argv[1]" = "switch" -a -d "$output"
        cd "$output"
        or return 1
        echo "Switched to: $output"
    else
        echo "$output"
    end

    return $exit_code
end
```

### Bash

Add to your `~/.bashrc`:

```bash
source /path/to/gwtree/shell-integration/bash.sh
```

Or copy the function directly - see `bash.sh`.

### Zsh

Add to your `~/.zshrc`:

```zsh
source /path/to/gwtree/shell-integration/zsh.sh
```

Or copy the function directly - see `zsh.sh`.

## How It Works

The shell function wraps the `gwt` command and:
1. Captures the output of the command
2. Checks if it's a `switch` command that succeeded
3. If the output is a valid directory path, changes to that directory
4. Otherwise, displays the output normally

This allows `gwt switch` to actually change your shell's current directory, which a standalone binary cannot do.

## Note

After sourcing the integration script, you may need to:
- Restart your shell, or
- Run `source ~/.config/fish/config.fish` (or equivalent for your shell)
