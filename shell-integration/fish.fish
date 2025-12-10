# gwt - Git Worktree Manager
# Fish shell integration for directory switching

function gwt
    # For switch command, capture output and cd to the result
    if test "$argv[1]" = "switch"
        # Connect stdin to terminal for interactive prompts
        set -l output (command gwt $argv </dev/tty)
        set -l exit_code $status

        if test $exit_code -eq 0 -a -d "$output"
            cd "$output"
            or return 1
            echo "Switched to: $output"
        else
            echo "$output"
        end

        return $exit_code
    else
        # Run normally for other commands
        command gwt $argv
    end
end
