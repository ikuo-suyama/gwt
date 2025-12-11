#!/bin/bash
# gwt Shell Integration Installer
# Automatically detects your shell and installs the appropriate integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL for downloading shell integration files
GITHUB_RAW_BASE="https://raw.githubusercontent.com/ikuo-suyama/gwt/master/shell-integration"

# Helper functions
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Detect current shell
detect_shell() {
    local shell_path="$SHELL"
    local shell_name=$(basename "$shell_path")

    case "$shell_name" in
        bash)
            echo "bash"
            ;;
        zsh)
            echo "zsh"
            ;;
        fish)
            echo "fish"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Check if gwt integration is already installed
is_already_installed() {
    local shell_type=$1
    local config_file=$2

    case "$shell_type" in
        bash|zsh)
            if [ -f "$config_file" ]; then
                if grep -q "# gwt - Git Worktree Manager (shell integration)" "$config_file" 2>/dev/null; then
                    return 0
                fi
            fi
            return 1
            ;;
        fish)
            # Check both config.fish and conf.d directory
            if [ -f "$HOME/.config/fish/conf.d/gwt.fish" ]; then
                return 0
            fi
            if [ -f "$config_file" ]; then
                if grep -q "# gwt - Git Worktree Manager" "$config_file" 2>/dev/null; then
                    return 0
                fi
            fi
            return 1
            ;;
        *)
            return 1
            ;;
    esac
}

# Download file from GitHub or use local file
get_integration_file() {
    local shell_type=$1
    local filename=""

    case "$shell_type" in
        bash)
            filename="bash.sh"
            ;;
        zsh)
            filename="zsh.sh"
            ;;
        fish)
            filename="fish.fish"
            ;;
    esac

    # Check if we're running from the repository
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$script_dir/$filename" ]; then
        cat "$script_dir/$filename"
        return 0
    fi

    # Download from GitHub
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$GITHUB_RAW_BASE/$filename"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- "$GITHUB_RAW_BASE/$filename"
    else
        error "Neither curl nor wget is available. Please install one of them."
        return 1
    fi
}

# Install for Bash
install_bash() {
    local config_file="$HOME/.bashrc"

    info "Installing gwt shell integration for Bash..."

    if is_already_installed "bash" "$config_file"; then
        warning "gwt shell integration is already installed in $config_file"
        return 0
    fi

    local integration_content
    integration_content=$(get_integration_file "bash")

    if [ -z "$integration_content" ]; then
        error "Failed to get Bash integration file"
        return 1
    fi

    echo "" >> "$config_file"
    echo "# gwt - Git Worktree Manager (shell integration)" >> "$config_file"
    echo "$integration_content" >> "$config_file"

    success "Bash integration installed to $config_file"
    info "Please restart your shell or run: exec \$SHELL -l"
}

# Install for Zsh
install_zsh() {
    local config_file="$HOME/.zshrc"

    info "Installing gwt shell integration for Zsh..."

    if is_already_installed "zsh" "$config_file"; then
        warning "gwt shell integration is already installed in $config_file"
        return 0
    fi

    local integration_content
    integration_content=$(get_integration_file "zsh")

    if [ -z "$integration_content" ]; then
        error "Failed to get Zsh integration file"
        return 1
    fi

    echo "" >> "$config_file"
    echo "# gwt - Git Worktree Manager (shell integration)" >> "$config_file"
    echo "$integration_content" >> "$config_file"

    success "Zsh integration installed to $config_file"
    info "Please restart your shell or run: exec \$SHELL -l"
}

# Install for Fish
install_fish() {
    local conf_d_dir="$HOME/.config/fish/conf.d"
    local conf_d_file="$conf_d_dir/gwt.fish"
    local config_file="$HOME/.config/fish/config.fish"

    info "Installing gwt shell integration for Fish..."

    # Create conf.d directory if it doesn't exist
    if [ ! -d "$conf_d_dir" ]; then
        mkdir -p "$conf_d_dir"
        info "Created directory: $conf_d_dir"
    fi

    # Check if already installed
    if is_already_installed "fish" "$config_file"; then
        warning "gwt shell integration is already installed in Fish"
        return 0
    fi

    local integration_content
    integration_content=$(get_integration_file "fish")

    if [ -z "$integration_content" ]; then
        error "Failed to get Fish integration file"
        return 1
    fi

    # Install to conf.d directory (recommended method)
    echo "$integration_content" > "$conf_d_file"

    success "Fish integration installed to $conf_d_file"
    info "Please restart your shell or run: exec \$SHELL -l"
}

# Main installation logic
main() {
    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║  gwt Shell Integration Installer        ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""

    local shell_type=$(detect_shell)

    if [ "$shell_type" = "unknown" ]; then
        error "Unsupported shell: $SHELL"
        error "Supported shells: bash, zsh, fish"
        exit 1
    fi

    info "Detected shell: $shell_type"
    echo ""

    case "$shell_type" in
        bash)
            install_bash
            ;;
        zsh)
            install_zsh
            ;;
        fish)
            install_fish
            ;;
    esac

    echo ""
    success "Installation completed!"
    echo ""
    info "What's next?"
    echo "  1. Restart your shell: exec \$SHELL -l"
    echo "  2. Try: gwt add feature/test"
    echo ""
}

# Run main function
main "$@"
