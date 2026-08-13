$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Port = if ($env:PORT) { $env:PORT } else { "4173" }
$env:PORTABLE_ROOT = $Root
$env:PORT = $Port

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required for this portable launcher. Bundle a Node runtime in portable/runtime/node for a no-install USB package."
}

$process = Start-Process -FilePath "node" -ArgumentList @("$Root/portable/start-runtime.mjs") -WorkingDirectory $Root -PassThru
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:$Port"
try { Wait-Process -Id $process.Id } finally { if (-not $process.HasExited) { Stop-Process -Id $process.Id } }
