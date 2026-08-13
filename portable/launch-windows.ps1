$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Port = if ($env:PORT) { $env:PORT } else { "4173" }
$env:PORTABLE_ROOT = $Root
$env:PORT = $Port

$Architecture = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
$BundledNode = Join-Path $Root "portable-runtime\windows-$Architecture\node.exe"
if (Test-Path $BundledNode) {
  $NodeBin = $BundledNode
} else {
  $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if (-not $NodeCommand) {
    Write-Error "No compatible Node.js runtime found. Add portable-runtime\windows-$Architecture\node.exe or install Node.js 22+."
  }
  $NodeBin = $NodeCommand.Source
}

$process = Start-Process -FilePath $NodeBin -ArgumentList @("$Root\portable\start-runtime.mjs") -WorkingDirectory $Root -PassThru
try { Wait-Process -Id $process.Id } finally { if (-not $process.HasExited) { Stop-Process -Id $process.Id } }
