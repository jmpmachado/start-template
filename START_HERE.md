# Start Here

5 steps from clone to first sprint for beginners.

> 📖 **Full install guide:** [TOOLING_SETUP.md](TOOLING_SETUP.md) — Node.js, Python, and .NET 9 with winget one-liners, official download links, and troubleshooting.

---

## Step 1 — Prerequisites (5–10 min)

Check each tool. Install any that are missing.

### Node.js ≥ 24 (mandatory — runs tests, lint, drift scanner)

```powershell
node --version   # must be v24+
npm --version    # must be 10+
```

If not installed:
```powershell
winget install --id OpenJS.NodeJS.LTS --accept-package-agreements
# Open a new terminal, then: node --version
```

> Alternative: download from <https://nodejs.org> | Full guide: [TOOLING_SETUP.md §1](TOOLING_SETUP.md)

---

### .NET 9 SDK (mandatory — builds backend API)

```powershell
dotnet --version   # must be 9.x.x
```

If not installed:
```powershell
winget install --id Microsoft.DotNet.SDK.9 --accept-package-agreements
# Open a new terminal, then: dotnet --version
```

> Fresh machine without VS2022? See [DOTNET_SETUP.md §1](DOTNET_SETUP.md) for VS2022 Build Tools silent install.

---

### Python ≥ 3.10 (optional — only for `infra/scripts/`)

```powershell
python --version   # 3.10+ if needed
```

If needed:
```powershell
winget install --id Python.Python.3.12 --accept-package-agreements
pip install pyyaml  # required by risk_engine.py
```

> Full guide: [TOOLING_SETUP.md §3](TOOLING_SETUP.md)

---

## Step 2 — Install & Verify (3 min)

```powershell
# Install Node.js tooling
cd tooling && npm install
cd ..

# Run governance tests
npm --prefix tooling test
# Expected: 48 passed | 3 todo | 1 skipped

# Run drift scanner
npm --prefix tooling run check-drift
# Expected: 0 high findings

# Build and test the .NET backend
dotnet restore src/backend/backend.csproj
dotnet build src/backend/backend.csproj
dotnet test tests/backend/backend.tests.csproj
# Expected: 1 passed, 0 failed
```

---

## Step 3 — Review operating rules (5–10 min)

Before writing any code, open and review:
- `GEMINI.md` (or `CLAUDE.md` / Copilot guidelines) — AI agent operating rules
- `.agent/context/AGENT_GUIDELINES.md` — Core behavioral invariants
- `AGENTS.md` — Full documentation file index

---

## Step 4 — Plan Sprint 01 (5–10 min)

- Open `.agent/context/BACKLOG.md`.
- Add your first user stories under Sprint `ADOPT-01`.
- Keep it lean: ≤ 3 user stories for your first sprint.
- Align with the operating guidelines during development.

---

## Step 5 — Run the stack (optional)

```powershell
# Start the .NET 9 backend API
dotnet run --project src/backend/backend.csproj
# Health check: https://localhost:5001/health
# Hello endpoint: https://localhost:5001/api/hello

# Open the frontend (no build needed)
start src/frontend/index.html
```
