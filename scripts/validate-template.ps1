#!/usr/bin/env pwsh
# validate-template.ps1 — Local integrity validation for the engineering template.
# Runs in < 30 seconds and exits 0 only when all checks pass.
# Usage: pwsh scripts/validate-template.ps1

param(
    [switch]$NoTests   # skip npm test (faster for quick checks)
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Pass([string]$msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green }
function Fail([string]$msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:failed = $true }

$script:failed = $false

Write-Host "`n=== Template Integrity Validation ===" -ForegroundColor Cyan

# ─── Check 1: All .agent/context/ files are registered in AGENTS.md ──────────
Write-Host "`n[1] AGENTS.md bidirectional consistency"

$agentsMd = Get-Content "$root\AGENTS.md" -Raw
$contextFiles = Get-ChildItem "$root\.agent\context\" -Filter "*.md" | Select-Object -ExpandProperty Name

$unregistered = @()
foreach ($file in $contextFiles) {
    if (-not $agentsMd.Contains($file)) {
        $unregistered += $file
    }
}

if ($unregistered.Count -eq 0) {
    Pass "All .agent/context/*.md files are registered in AGENTS.md"
} else {
    Fail "Orphaned files not in AGENTS.md: $($unregistered -join ', ')"
}

# Also check reverse: all AGENTS.md links exist on disk
$linkPattern = [regex]'\.agent/context/([a-zA-Z0-9_.-]+\.md)'
$matches = $linkPattern.Matches($agentsMd)
$missing = @()
foreach ($m in $matches) {
    $path = "$root\.agent\context\$($m.Groups[1].Value)"
    if (-not (Test-Path $path)) {
        $missing += $m.Groups[1].Value
    }
}
if ($missing.Count -eq 0) {
    Pass "All AGENTS.md links resolve to existing files"
} else {
    Fail "AGENTS.md links to missing files: $($missing -join ', ')"
}

# ─── Check 2: No unfilled [PROJECT_NAME] placeholders in governance files ─────
Write-Host "`n[2] Placeholder check (files that should be filled)"

# Files that adopters must customize — these should NOT have [PROJECT_NAME] after adoption
# In the template itself this check is advisory (we expect placeholders)
$filesToCheck = @(
    "AGENTS.md",
    "ONBOARDING.md",
    "CONTRIBUTING.md"
)

$placeholderPattern = [regex]'\[PROJECT_NAME\]|\[STACK\]|\[LANGUAGE\]'
$adoptionReminders = @()
foreach ($file in $filesToCheck) {
    $fullPath = "$root\$file"
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        if ($placeholderPattern.IsMatch($content)) {
            $adoptionReminders += $file
        }
    }
}

if ($adoptionReminders.Count -eq 0) {
    Pass "No adoption placeholders found in key files (template mode: advisory)"
} else {
    # Advisory only in the template itself — child projects should treat this as FAIL
    Write-Host "  [INFO] Adoption placeholders still present in: $($adoptionReminders -join ', ')" -ForegroundColor Yellow
    Write-Host "         Replace [PROJECT_NAME], [STACK], [LANGUAGE] before going live." -ForegroundColor Yellow
}

# ─── Check 3: npm test passes ─────────────────────────────────────────────────
Write-Host "`n[3] Test suite"

if ($NoTests) {
    Write-Host "  [SKIP] --NoTests flag set" -ForegroundColor Yellow
} else {
    Push-Location $root
    try {
        $result = npm test 2>&1
        if ($LASTEXITCODE -eq 0) {
            Pass "npm test passed"
        } else {
            Fail "npm test failed (exit $LASTEXITCODE)"
            Write-Host $result -ForegroundColor DarkRed
        }
    } finally {
        Pop-Location
    }
}

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host "`n=== Result ===" -ForegroundColor Cyan
if ($script:failed) {
    Write-Host "FAIL — one or more checks failed. Fix the issues above before committing." -ForegroundColor Red
    exit 1
} else {
    Write-Host "PASS — all checks passed." -ForegroundColor Green
    exit 0
}
