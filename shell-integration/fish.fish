# gwt - Git Worktree Manager
# Fish shell integration for directory switching

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
