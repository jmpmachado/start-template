# DOTNET_SETUP.md — .NET & VS2022 Build Tools Setup

> Prerequisites for building and running the `.NET 8/9` backend in this template.
> Estimated time: 10–15 minutes on a fresh machine.

---

## Decision Matrix — What to Install

| Your situation | What to install |
|---|---|
| No VS2022, no .NET | Install **VS2022 Build Tools** (includes .NET SDK) — see §1 |
| **VS2022 already installed** (Community / Pro / Enterprise) | Install **.NET 8 SDK standalone** only — see §2 ✅ |
| CI/CD agent (no GUI) | Install **VS2022 Build Tools + .NET SDK** silently — see §3 |

> **This project**: VS2022 base is present → follow **§2** (standalone .NET 8 SDK).

---

## §1 — Fresh Machine: VS2022 Build Tools Only (No Full VS)

Use this when you need MSBuild + C# compiler **without** the full VS2022 IDE.

### Download

| Package | URL |
|---|---|
| `vs_buildtools.exe` | <https://aka.ms/vs/17/release/vs_buildtools.exe> |
| Direct download (bookmark-friendly) | <https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022> |

### Silent Install (PowerShell — run as Administrator)

```powershell
# Download installer
Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" `
  -OutFile "$env:TEMP\vs_buildtools.exe"

# Install with .NET desktop build tools + ASP.NET workload
Start-Process -FilePath "$env:TEMP\vs_buildtools.exe" -ArgumentList `
  "--quiet", "--wait", "--norestart", `
  "--add", "Microsoft.VisualStudio.Workload.MSBuildTools", `
  "--add", "Microsoft.VisualStudio.Workload.NetCoreBuildTools", `
  "--add", "Microsoft.NetCore.Component.SDK" `
  -NoNewWindow -Wait

# Verify
& "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe" -version
```

### Workload IDs Reference

| Workload ID | Description |
|---|---|
| `Microsoft.VisualStudio.Workload.MSBuildTools` | Core MSBuild tools |
| `Microsoft.VisualStudio.Workload.NetCoreBuildTools` | .NET Core + ASP.NET build support |
| `Microsoft.NetCore.Component.SDK` | .NET SDK component |

> Full workload list: <https://learn.microsoft.com/visualstudio/install/workload-component-id-vs-build-tools>

---

## §2 — VS2022 Already Installed: Standalone .NET 8 SDK

This is the recommended path when VS2022 (Community / Pro / Enterprise) is already present.

### Option A — winget (recommended)

```powershell
# Install .NET 8 LTS SDK
winget install --id Microsoft.DotNet.SDK.8 --source winget --accept-package-agreements

# Verify (open a new terminal after install)
dotnet --version          # should print 8.x.x
dotnet --list-sdks        # lists all installed SDKs
```

### Option B — Manual download

| Package | URL |
|---|---|
| .NET 8 SDK (Windows x64) | <https://dotnet.microsoft.com/download/dotnet/8.0> |
| Direct installer link | <https://builds.dotnet.microsoft.com/dotnet/Sdk/8.0.421/dotnet-sdk-8.0.421-win-x64.exe> |

Run the installer, accept defaults. Open a **new** terminal and run `dotnet --version`.

### Option C — Add via VS2022 Installer (GUI)

1. Open **Visual Studio Installer**
2. Click **Modify** on your VS2022 installation
3. Select **ASP.NET and web development** workload
4. Under **Individual components** → check **.NET 8 Runtime (LTS)**
5. Click **Modify** and wait

---

## §3 — CI/CD Agent: Silent Headless Install

```powershell
# Full Build Tools + .NET SDK for a CI agent (no GUI, run as Administrator)
Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" `
  -OutFile "$env:TEMP\vs_buildtools.exe"

Start-Process -FilePath "$env:TEMP\vs_buildtools.exe" -ArgumentList `
  "--quiet", "--wait", "--norestart", "--nocache", `
  "--add", "Microsoft.VisualStudio.Workload.NetCoreBuildTools", `
  "--add", "Microsoft.NetCore.Component.SDK", `
  "--add", "Microsoft.VisualStudio.Component.NuGet.BuildTools" `
  -NoNewWindow -Wait

# Install .NET 8 SDK separately for full CLI access
winget install --id Microsoft.DotNet.SDK.8 --source winget `
  --accept-package-agreements --accept-source-agreements --silent
```

---

## §4 — Verify the Full Backend Stack

After installing .NET 8, run these commands from the repo root:

```powershell
# Check SDK version
dotnet --version
# Expected: 8.x.x

# Restore dependencies
dotnet restore src/backend/backend.csproj

# Build the backend
dotnet build src/backend/backend.csproj

# Run the API locally (opens on https://localhost:5001)
dotnet run --project src/backend/backend.csproj

# Run backend tests
dotnet test tests/backend/backend.tests.csproj
```

### Expected output

```
Build succeeded.
  0 Warning(s)
  0 Error(s)
```

---

## §5 — Troubleshooting

### `dotnet` not found after install

The installer does not always refresh the current terminal's PATH.

```powershell
# Option 1: close and reopen terminal
# Option 2: refresh PATH in current session
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")
dotnet --version
```

### SDK version mismatch

```powershell
dotnet --list-sdks          # see all installed SDKs
dotnet --list-runtimes      # see all runtimes
```

The project targets `net8.0`. If you have only .NET 9, change the TFM in `backend.csproj`:
```xml
<TargetFramework>net9.0</TargetFramework>
```

### Build fails with `NETSDK1045`

This error means the SDK version is lower than the TFM requires.
Install the correct .NET SDK version per the matrix above.

### Port 5001 already in use

```powershell
dotnet run --project src/backend/backend.csproj --urls "https://localhost:5050"
```

---

## §6 — Version Compatibility Matrix

| Component | Minimum | Recommended | Notes |
|---|---|---|---|
| .NET SDK | 8.0.x (LTS) | 8.0.421 | net8.0 TFM |
| VS2022 Build Tools | 17.8+ | 17.10+ | If no full VS |
| VS2022 (full) | 17.8+ | 17.12+ | If already installed |
| Windows | 10 1903+ | 11 22H2+ | Required for net8.0 |

---

*See `ONBOARDING.md` for the full environment setup guide.*
