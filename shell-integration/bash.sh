# gwt - Git Worktree Manager
# Bash shell integration for directory switching

gwt() {
  local output
  output=$(command gwt "$@")
  local exit_code=$?

  # Check if output is a directory path (for switch command)
  if [[ $exit_code -eq 0 && "$1" == "switch" && -d "$output" ]]; then
    cd "$output" || return 1
    echo "Switched to: $output"
  else
    echo "$output"
  fi

  return $exit_code
}
