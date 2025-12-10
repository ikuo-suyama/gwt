# gwt - Git Worktree Manager
# Zsh shell integration for directory switching

gwt() {
  # For add and switch commands, capture output and cd to the result
  if [[ "$1" == "add" || "$1" == "switch" ]]; then
    local output
    # Connect stdin and stderr to terminal for interactive prompts
    # Capture stdout (the path result)
    output=$(command gwt "$@" </dev/tty 2>/dev/tty)
    local exit_code=$?

    if [[ $exit_code -eq 0 && -d "$output" ]]; then
      cd "$output" || return 1
      echo "Switched to: $output"
    elif [[ -n "$output" ]]; then
      echo "$output"
    fi

    return $exit_code
  else
    # Run normally for other commands
    command gwt "$@"
  fi
}
