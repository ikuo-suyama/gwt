# gwt - Git Worktree Manager
# Bash shell integration for directory switching

gwt() {
  # For switch command, capture output and cd to the result
  if [[ "$1" == "switch" ]]; then
    local output
    # Connect stdin to terminal for interactive prompts
    output=$(command gwt "$@" </dev/tty)
    local exit_code=$?

    if [[ $exit_code -eq 0 && -d "$output" ]]; then
      cd "$output" || return 1
      echo "Switched to: $output"
    else
      echo "$output"
    fi

    return $exit_code
  else
    # Run normally for other commands
    command gwt "$@"
  fi
}
