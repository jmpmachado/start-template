# Start Here

5 steps from clone to first sprint for beginners.

## Step 1 — Prerequisites (5 min)

**Node.js tooling** (governance, lint, tests):
- Node ≥ 24 → check: `node --version`
- npm ≥ 10 → check: `npm --version`

**Backend (.NET 8/9)**:
- .NET 8 SDK → check: `dotnet --version`
- If `dotnet` is not found, install it:

```powershell
# VS2022 already installed? Run this in PowerShell:
winget install --id Microsoft.DotNet.SDK.8 --accept-package-agreements
# Then open a new terminal and verify:
dotnet --version   # expected: 8.x.x
```

> Fresh machine (no VS2022)? See [DOTNET_SETUP.md §1](DOTNET_SETUP.md) for VS2022 Build Tools silent install.

## Step 2 — Install & Verify (3 min)

Run the Node.js test suite and drift scanner to verify the governance layer:

```powershell
cd tooling && npm install
npm test
npm run check-drift
```

Then verify the .NET backend builds:

```powershell
dotnet restore src/backend/backend.csproj
dotnet build src/backend/backend.csproj
```

All tests must pass and drift check must show 0 high findings.

## Step 3 — Review operating rules (5–10 min)

Before writing any code, open and review these files:
- `GEMINI.md` (or `CLAUDE.md` / Copilot guidelines)
- `.agent/context/AGENT_GUIDELINES.md` — Core operating rules
- `AGENTS.md` — Full documentation file index

## Step 4 — Plan Sprint 01 (5–10 min)

- Open `.agent/context/BACKLOG.md`.
- Edit/Add your first user stories under Sprint `ADOPT-01`.
- Keep it lean: ≤ 3 user stories for your first sprint.
- Align with the operating guidelines during development.

## Step 5 — Run the backend (optional)

```powershell
# Start the API (requires .NET 8 SDK — see Step 1)
dotnet run --project src/backend/backend.csproj

# Open browser to test:
# https://localhost:5001/health
# https://localhost:5001/api/hello

# Open the frontend:
# Double-click src/frontend/index.html in Explorer, or:
start src/frontend/index.html
```
