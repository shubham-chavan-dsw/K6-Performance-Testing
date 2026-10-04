$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

New-Item -ItemType Directory -Force ".\reports" | Out-Null

$env:K6_WEB_DASHBOARD = "true"
$env:K6_WEB_DASHBOARD_EXPORT = "reports/agent-inference-no-attachment.html"
$env:K6_PROMETHEUS_RW_SERVER_URL = "http://localhost:9090/api/v1/write"

k6 run -o experimental-prometheus-rw ".\tests\agent-inference\agent-inference-no-attachment.ts"

if (Test-Path ".\reports\agent-inference-no-attachment.html") {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "NO-ATTACHMENT HTML REPORT GENERATED SUCCESSFULLY"
    Write-Host "=========================================="
    Write-Host "$projectRoot\reports\agent-inference-no-attachment.html"
}
else {
    Write-Error "No-attachment HTML report was NOT generated."
}   