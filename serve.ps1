# Launches the showroom model in your default browser.
# Buildless: no Node/npm required — Three.js loads from a CDN via importmap.
param([int]$Port = 5173)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "Serving showroom model at http://localhost:$Port/ ..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray

Start-Process "http://localhost:$Port/"
python -m http.server $Port
