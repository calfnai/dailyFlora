param(
  [string]$InstallerPath
)

$ErrorActionPreference = 'Stop'
$releaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $releaseDir 'SHA256SUMS.txt'

if (-not (Test-Path -LiteralPath $manifestPath)) {
  Write-Error "SHA256SUMS.txt not found beside this script."
  exit 1
}

$targets = @()
if ($InstallerPath) {
  $targets = @(Resolve-Path -LiteralPath $InstallerPath)
} else {
  $targets = @(Get-ChildItem -LiteralPath $releaseDir -Filter 'DailyFlora-*.exe' -File |
    Where-Object { $_.Name -match '-(setup|portable)\.exe$' })
}

if (-not $targets.Count) {
  Write-Error "No DailyFlora executable found."
  exit 1
}

$expected = @{}
foreach ($line in Get-Content -LiteralPath $manifestPath) {
  if ($line -match '^([0-9a-fA-F]{64})\s+\*?(.+)$') {
    $expected[$matches[2].Trim()] = $matches[1].ToLowerInvariant()
  }
}

$failed = $false
foreach ($target in $targets) {
  $file = Get-Item -LiteralPath $target
  $actual = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  $expectedHash = $expected[$file.Name]
  if (-not $expectedHash) {
    Write-Host "MISSING  $($file.Name)  (not listed in SHA256SUMS.txt)" -ForegroundColor Red
    $failed = $true
  } elseif ($actual -eq $expectedHash) {
    Write-Host "OK       $($file.Name)  $actual" -ForegroundColor Green
  } else {
    Write-Host "FAILED   $($file.Name)" -ForegroundColor Red
    Write-Host "Expected $expectedHash"
    Write-Host "Actual   $actual"
    $failed = $true
  }
}

if ($failed) {
  Write-Error 'DailyFlora package verification failed.'
  exit 1
}

Write-Host 'DailyFlora package verification passed.' -ForegroundColor Green
