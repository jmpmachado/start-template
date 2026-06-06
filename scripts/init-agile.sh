#!/usr/bin/env bash
# init-agile.sh — Unix/macOS wrapper for init-agile.js
# Usage: bash scripts/init-agile.sh  OR  ./scripts/init-agile.sh
# Requires Node.js 22+. If not installed, this script will guide you.

set -euo pipefail

MIN_NODE=22
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_install_guide() {
  local os
  os="$(uname -s)"

  echo ""
  echo "  Node.js ${MIN_NODE} LTS or later is required to run the adoption wizard."
  echo ""
  echo "  Install options:"

  case "$os" in
    Linux)
      echo "    1. NodeSource (Ubuntu/Debian):"
      echo "       curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -"
      echo "       sudo apt-get install -y nodejs"
      echo ""
      echo "    2. NodeSource (RHEL/Fedora/CentOS):"
      echo "       curl -fsSL https://rpm.nodesource.com/setup_24.x | sudo bash -"
      echo "       sudo dnf install -y nodejs"
      echo ""
      echo "    3. nvm (version manager — recommended for developers):"
      echo "       curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash"
      echo "       # reopen terminal, then:"
      echo "       nvm install --lts && nvm use --lts"
      echo ""
      echo "    4. Snap:"
      echo "       sudo snap install node --classic --channel=24/stable"
      ;;
    Darwin)
      echo "    1. Official installer (recommended):"
      echo "       https://nodejs.org/en/download  →  choose Node 24 LTS"
      echo ""
      echo "    2. Homebrew:"
      echo "       brew install node@24"
      echo "       echo 'export PATH=\"/usr/local/opt/node@24/bin:\$PATH\"' >> ~/.zshrc"
      echo ""
      echo "    3. nvm (version manager — recommended for developers):"
      echo "       curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash"
      echo "       # reopen terminal, then:"
      echo "       nvm install --lts && nvm use --lts"
      echo ""
      echo "    4. MacPorts:"
      echo "       sudo port install nodejs24"
      ;;
    *)
      echo "    Official installer: https://nodejs.org/en/download"
      echo "    nvm: https://github.com/nvm-sh/nvm"
      ;;
  esac

  echo ""
  echo "  After installing Node.js, reopen your terminal and rerun this script."
  echo ""
}

# Check if node is available
if ! command -v node &>/dev/null; then
  echo ""
  echo "  ERROR: 'node' command not found in PATH." >&2
  show_install_guide
  exit 1
fi

# Check version
NODE_VERSION="$(node --version | tr -d 'v')"
NODE_MAJOR="$(echo "$NODE_VERSION" | cut -d. -f1)"

if [ "$NODE_MAJOR" -lt "$MIN_NODE" ]; then
  echo ""
  echo "  ERROR: Node.js ${NODE_VERSION} detected. Minimum required: ${MIN_NODE} LTS." >&2
  echo "  Node 20 is deprecated (EOL 2026-04-30). Node 22 is Maintenance LTS; Node 24 is Active LTS." >&2
  show_install_guide
  exit 1
fi

echo "  Node.js ${NODE_VERSION} detected. Launching wizard..."
echo ""

exec node "${SCRIPT_DIR}/init-agile.js"
