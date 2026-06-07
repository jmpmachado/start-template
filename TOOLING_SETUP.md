# TOOLING_SETUP.md — Node.js & .NET Setup

> Install prerequisites for building and running all stacks in this template.
> **Estimated time:** 5–10 minutes depending on what is already installed.

---

## Quick Decision — What do I need?

| Tool | Why | Required? |
|---|---|---|
| **Node.js ≥ 24** | Runs `npm test`, `npm run lint`, `npm run check-drift` | ✅ **Mandatory** |
| **.NET 9 SDK** | Builds and runs the backend API (`src/backend/`) | ✅ Mandatory for backend work |

---

## §1 — Node.js ≥ 24 (Mandatory)

### Check if already installed

```powershell
node --version   # expected: v24.x.x or higher
npm --version    # expected: 10.x.x or higher
```

### Option A — winget (recommended on Windows)

```powershell
winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
# After install: open a new terminal and verify
node --version
```

### Option B — Official installer

| Platform | URL |
|---|---|
| Windows (x64) | <https://nodejs.org/en/download> |
| Direct LTS download | <https://nodejs.org/dist/latest-v22.x/> |

Download and run the `.msi` installer, accept defaults (includes `npm`).

### Option C — nvm (Node Version Manager — for multiple Node versions)

```powershell
# Install nvm-windows first: https://github.com/coreybutler/nvm-windows/releases
nvm install 24
nvm use 24
node --version
```

### Verify after install

```powershell
node --version      # v24.x.x or higher
npm --version       # 10.x.x or higher
npx --version       # comes with npm
```

---

## §2 — .NET 9 SDK (Mandatory for backend)

See **[DOTNET_SETUP.md](DOTNET_SETUP.md)** for the full installation guide.

Quick path if VS2022 is already installed:

```powershell
winget install --id Microsoft.DotNet.SDK.9 --accept-package-agreements
# Open a new terminal, then:
dotnet --version   # expected: 9.x.x
```

---

## §3 — Full Stack Verify

After installing all tools, run this sequence from the repo root to confirm everything works:

```powershell
# 1. Verify runtimes
node --version        # v24+
dotnet --version      # 9.x.x

# 2. Install Node.js tooling
cd tooling && npm install
cd ..

# 3. Run governance tests (Node.js)
npm --prefix tooling test
# Expected: Vitest suite passes

# 4. Run drift scanner
npm --prefix tooling run check-drift
# Expected: 0 high findings

# 5. Build and test the .NET backend
dotnet restore src/backend/backend.csproj
dotnet build src/backend/backend.csproj
dotnet test tests/backend/backend.tests.csproj
# Expected: 1 passed, 0 failed

# 6. Open the frontend (no build step needed)
start src/frontend/index.html
```

---

## §4 — Troubleshooting

### `node` not found after install

```powershell
# Refresh PATH in current terminal
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")
node --version
```

### `npm install` fails with EACCES / permission errors

```powershell
# Run terminal as Administrator, or fix npm prefix:
npm config set prefix "$env:APPDATA\npm"
```

### Node version is too old (v18, v20)

```powershell
# Upgrade via winget
winget upgrade --id OpenJS.NodeJS.LTS
# Or use nvm:
nvm install 24 && nvm use 24
```

---

## §5 — Version Compatibility Matrix

| Tool | Minimum | Recommended | Install command |
|---|---|---|---|
| Node.js | 24.x | 24.x LTS | `winget install OpenJS.NodeJS.LTS` |
| npm | 10.x | bundled with Node | — |
| .NET SDK | 9.0.x | 9.0.314 | `winget install Microsoft.DotNet.SDK.9` |
| Windows | 10 1903+ | 11 22H2+ | — |

---

*See [DOTNET_SETUP.md](DOTNET_SETUP.md) for detailed .NET + VS2022 Build Tools options.*  
*See [ONBOARDING.md](ONBOARDING.md) for the full environment setup guide.*
