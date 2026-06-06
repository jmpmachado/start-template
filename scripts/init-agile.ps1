# init-agile.ps1 — Windows wrapper for init-agile.js
# Usage: .\scripts\init-agile.ps1
# Requires Node.js 22+. If not installed, this script will guide you.

$MIN_NODE = 22

function Show-InstallGuide {
  Write-Host ""
  Write-Host "  Node.js $MIN_NODE LTS or later is required to run the adoption wizard." -ForegroundColor Red
  Write-Host ""
  Write-Host "  Install options:" -ForegroundColor Yellow
  Write-Host "    1. Official installer (recommended):"
  Write-Host "       https://nodejs.org/en/download  →  choose Node 24 LTS"
  Write-Host ""
  Write-Host "    2. winget (Windows 10/11):"
  Write-Host "       winget install OpenJS.NodeJS.LTS"
  Write-Host ""
  Write-Host "    3. nvm-windows (version manager — recommended for developers):"
  Write-Host "       https://github.com/coreybutler/nvm-windows/releases"
  Write-Host "       After install: nvm install lts && nvm use lts"
  Write-Host ""
  Write-Host "    4. Scoop:"
  Write-Host "       scoop install nodejs-lts"
  Write-Host ""
  Write-Host "  After installing Node.js, reopen your terminal and rerun this script." -ForegroundColor Cyan
  Write-Host ""
}

# Check if node is available
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Host ""
  Write-Host "  ERROR: 'node' command not found in PATH." -ForegroundColor Red
  Show-InstallGuide
  exit 1
}

# Check version
$nodeVersion = (node --version) -replace 'v', ''
$nodeMajor = [int]($nodeVersion.Split('.')[0])

if ($nodeMajor -lt $MIN_NODE) {
  Write-Host ""
  Write-Host "  ERROR: Node.js $nodeVersion detected. Minimum required: $MIN_NODE LTS." -ForegroundColor Red
  Write-Host "  Node 20 is deprecated (EOL 2026-04-30). Node 22 is Maintenance LTS; Node 24 is Active LTS." -ForegroundColor Yellow
  Show-InstallGuide
  exit 1
}

Write-Host "  Node.js $nodeVersion detected. Launching wizard..." -ForegroundColor Green
Write-Host ""

# Run the wizard
node "$PSScriptRoot\init-agile.js"
exit $LASTEXITCODE
