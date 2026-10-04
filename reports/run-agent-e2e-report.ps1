$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

New-Item -ItemType Directory -Force ".\reports" | Out-Null

$env:K6_WEB_DASHBOARD = "true"
$env:K6_WEB_DASHBOARD_EXPORT = "reports/agent-e2e-upload-inference.html"
$env:K6_PROMETHEUS_RW_SERVER_URL = "http://localhost:9090/api/v1/write"

k6 run -o experimental-prometheus-rw ".\tests\agent-inference\agent-e2e-upload-inference.ts"

if (Test-Path ".\reports\agent-e2e-upload-inference.html") {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "E2E HTML REPORT GENERATED SUCCESSFULLY"
    Write-Host "=========================================="
    Write-Host "$projectRoot\reports\agent-e2e-upload-inference.html"
}
else {
    Write-Error "E2E HTML report was NOT generated."
}