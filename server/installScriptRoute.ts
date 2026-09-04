import { Router } from "express";

export const installScriptRouter = Router();

const INSTALL_SCRIPT = `#!/bin/sh
set -e

# Nexus OS Installer
# Usage: curl -fsSL https://aiagents.nexus/install.sh | sh

REPO="leonidas-esquire/nexus-os"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="naos"

# Colors
if [ -t 1 ]; then
    RED='\\033[0;31m'
    GREEN='\\033[0;32m'
    YELLOW='\\033[0;33m'
    BLUE='\\033[0;34m'
    BOLD='\\033[1m'
    NC='\\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' BOLD='' NC=''
fi

info() { printf "\${BLUE}info\${NC}: %s\\n" "$1"; }
success() { printf "\${GREEN}success\${NC}: %s\\n" "$1"; }
warn() { printf "\${YELLOW}warning\${NC}: %s\\n" "$1"; }
error() { printf "\${RED}error\${NC}: %s\\n" "$1" >&2; exit 1; }

detect_os() {
    case "$(uname -s)" in
        Linux*)  OS="linux" ;;
        Darwin*) OS="darwin" ;;
        *)       error "Unsupported OS: $(uname -s)" ;;
    esac
}

detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64)  ARCH="x86_64" ;;
        arm64|aarch64) ARCH="aarch64" ;;
        *)             error "Unsupported architecture: $(uname -m)" ;;
    esac
}

get_latest_version() {
    VERSION=$(curl -fsSL "https://api.github.com/repos/\${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\\1/')
    [ -z "$VERSION" ] && error "Failed to get latest version"
}

download_and_install() {
    FILENAME="\${BINARY_NAME}-\${VERSION}-\${OS}-\${ARCH}"
    URL="https://github.com/\${REPO}/releases/download/\${VERSION}/\${FILENAME}"
    CHECKSUM_URL="https://github.com/\${REPO}/releases/download/\${VERSION}/checksums.txt"
    
    info "Downloading Nexus OS \${VERSION} for \${OS}/\${ARCH}..."
    
    TMP_DIR=$(mktemp -d)
    TMP_FILE="\${TMP_DIR}/\${BINARY_NAME}"
    
    if ! curl -fsSL -o "$TMP_FILE" "$URL"; then
        rm -rf "$TMP_DIR"
        error "Download failed. Binary may not exist for \${OS}/\${ARCH}."
    fi
    
    chmod +x "$TMP_FILE"
    
    # Verify checksum
    info "Verifying checksum..."
    CHECKSUMS=$(curl -fsSL "$CHECKSUM_URL" 2>/dev/null || echo "")
    if [ -n "$CHECKSUMS" ]; then
        EXPECTED=$(echo "$CHECKSUMS" | grep "$FILENAME" | awk '{print $1}')
        if [ -n "$EXPECTED" ]; then
            if command -v sha256sum >/dev/null 2>&1; then
                ACTUAL=$(sha256sum "$TMP_FILE" | awk '{print $1}')
            elif command -v shasum >/dev/null 2>&1; then
                ACTUAL=$(shasum -a 256 "$TMP_FILE" | awk '{print $1}')
            fi
            [ "$ACTUAL" = "$EXPECTED" ] && success "Checksum verified" || warn "Checksum mismatch"
        fi
    fi
    
    # Install
    info "Installing to \${INSTALL_DIR}/\${BINARY_NAME}..."
    if [ -w "$INSTALL_DIR" ]; then
        mv "$TMP_FILE" "\${INSTALL_DIR}/\${BINARY_NAME}"
    elif command -v sudo >/dev/null 2>&1; then
        sudo mv "$TMP_FILE" "\${INSTALL_DIR}/\${BINARY_NAME}"
    else
        INSTALL_DIR="$HOME/.local/bin"
        mkdir -p "$INSTALL_DIR"
        mv "$TMP_FILE" "\${INSTALL_DIR}/\${BINARY_NAME}"
        warn "Installed to \${INSTALL_DIR}. Add it to your PATH if needed."
    fi
    
    rm -rf "$TMP_DIR"
}

print_success() {
    echo ""
    success "Nexus OS installed successfully!"
    echo ""
    echo "\${BOLD}Get started:\${NC}"
    echo ""
    echo "    \${GREEN}naos init my-project\${NC}"
    echo "    \${GREEN}cd my-project\${NC}"
    echo "    \${GREEN}naos create hello\${NC}"
    echo "    \${GREEN}naos run hello\${NC}"
    echo ""
    echo "Docs: \${BLUE}https://aiagents.nexus/docs\${NC}"
    echo ""
}

main() {
    echo ""
    echo "\${BOLD}Nexus OS Installer\${NC}"
    echo ""
    detect_os
    detect_arch
    get_latest_version
    download_and_install
    print_success
}

main
`;

installScriptRouter.get("/install.sh", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="install.sh"');
  res.send(INSTALL_SCRIPT);
});
