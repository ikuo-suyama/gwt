#!/bin/bash
# gwt Shell Integration Installer
# Automatically detects your shell and installs the appropriate integration

set -e

# Version of shell integration
SHELL_INTEGRATION_VERSION="1.0.0"

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

# Check if gwt integration is already installed and get version
check_installation() {
    local shell_type=$1
    local config_file=$2
    local file_to_check=""

    case "$shell_type" in
        bash|zsh)
            file_to_check="$config_file"
            ;;
        fish)
            # Check conf.d directory first (recommended location)
            if [ -f "$HOME/.config/fish/conf.d/gwt.fish" ]; then
                file_to_check="$HOME/.config/fish/conf.d/gwt.fish"
            else
                file_to_check="$config_file"
            fi
            ;;
    esac

    if [ ! -f "$file_to_check" ]; then
        echo "not_installed"
        return
    fi

    # Check for version marker
    local version=$(grep "# Version:" "$file_to_check" 2>/dev/null | head -1 | sed 's/.*Version: //')

    if [ -n "$version" ]; then
        echo "$version"
    elif grep -q "# gwt - Git Worktree Manager" "$file_to_check" 2>/dev/null; then
        # Old installation without version
        echo "legacy"
    else
        echo "not_installed"
    fi
}

# Compare versions (returns 0 if v1 < v2, 1 if v1 >= v2)
version_less_than() {
    local v1=$1
    local v2=$2

    if [ "$v1" = "legacy" ]; then
        return 0  # legacy is always older
    fi

    # Simple version comparison (works for semantic versioning)
    printf '%s\n%s\n' "$v1" "$v2" | sort -V | head -1 | grep -q "^$v1$"
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

# Prompt user for confirmation
prompt_update() {
    local current_version=$1
    echo ""
    warning "A newer version of shell integration is available!"
    info "Installed version: $current_version"
    info "Latest version: $SHELL_INTEGRATION_VERSION"
    echo ""
    read -p "Would you like to update? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    return 1
}

# Remove old integration from config file
remove_old_integration() {
    local config_file=$1
    local temp_file=$(mktemp)

    # Remove lines between gwt markers
    awk '
        /# gwt - Git Worktree Manager/ { skip=1; next }
        /^function gwt|^gwt\(\)/ { if (skip) { in_func=1; next } }
        /^}/ { if (in_func) { in_func=0; skip=0; next } }
        !skip && !in_func { print }
        /^end$/ { if (in_func) { in_func=0; skip=0; next } }
    ' "$config_file" > "$temp_file"

    mv "$temp_file" "$config_file"
}

# Install for Bash
install_bash() {
    local config_file="$HOME/.bashrc"

    info "Checking Bash shell integration..."

    local current_version=$(check_installation "bash" "$config_file")

    if [ "$current_version" != "not_installed" ]; then
        if [ "$current_version" = "$SHELL_INTEGRATION_VERSION" ]; then
            success "Shell integration is already up to date (v$current_version)"
            return 0
        fi

        if ! prompt_update "$current_version"; then
            info "Update cancelled"
            return 0
        fi

        info "Updating shell integration..."
        remove_old_integration "$config_file"
    else
        info "Installing gwt shell integration for Bash..."
    fi

    local integration_content
    integration_content=$(get_integration_file "bash")

    if [ -z "$integration_content" ]; then
        error "Failed to get Bash integration file"
        return 1
    fi

    echo "" >> "$config_file"
    echo "$integration_content" >> "$config_file"

    success "Bash integration installed to $config_file"
    info "Please restart your shell or run: exec \$SHELL -l"
}

# Install for Zsh
install_zsh() {
    local config_file="$HOME/.zshrc"

    info "Checking Zsh shell integration..."

    local current_version=$(check_installation "zsh" "$config_file")

    if [ "$current_version" != "not_installed" ]; then
        if [ "$current_version" = "$SHELL_INTEGRATION_VERSION" ]; then
            success "Shell integration is already up to date (v$current_version)"
            return 0
        fi

        if ! prompt_update "$current_version"; then
            info "Update cancelled"
            return 0
        fi

        info "Updating shell integration..."
        remove_old_integration "$config_file"
    else
        info "Installing gwt shell integration for Zsh..."
    fi

    local integration_content
    integration_content=$(get_integration_file "zsh")

    if [ -z "$integration_content" ]; then
        error "Failed to get Zsh integration file"
        return 1
    fi

    echo "" >> "$config_file"
    echo "$integration_content" >> "$config_file"

    success "Zsh integration installed to $config_file"
    info "Please restart your shell or run: exec \$SHELL -l"
}

# Install for Fish
install_fish() {
    local conf_d_dir="$HOME/.config/fish/conf.d"
    local conf_d_file="$conf_d_dir/gwt.fish"
    local config_file="$HOME/.config/fish/config.fish"

    info "Checking Fish shell integration..."

    # Create conf.d directory if it doesn't exist
    if [ ! -d "$conf_d_dir" ]; then
        mkdir -p "$conf_d_dir"
        info "Created directory: $conf_d_dir"
    fi

    local current_version=$(check_installation "fish" "$config_file")

    if [ "$current_version" != "not_installed" ]; then
        if [ "$current_version" = "$SHELL_INTEGRATION_VERSION" ]; then
            success "Shell integration is already up to date (v$current_version)"
            return 0
        fi

        if ! prompt_update "$current_version"; then
            info "Update cancelled"
            return 0
        fi

        info "Updating shell integration..."
        # Remove old file if exists
        rm -f "$conf_d_file"
    else
        info "Installing gwt shell integration for Fish..."
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
