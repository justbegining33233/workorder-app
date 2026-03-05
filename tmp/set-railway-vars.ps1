# Reads .env.railway (pulled from Vercel) and sets every variable in Railway.
# Run from the workorder-app directory.

$envFile = Join-Path $PSScriptRoot "..\\.env.railway"
$lines = Get-Content $envFile | Where-Object { $_ -notmatch "^\s*#" -and $_.Trim() -ne "" }

$success = 0
$failed  = 0

foreach ($line in $lines) {
    # Match KEY="VALUE" or KEY=VALUE
    if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $key = $matches[1]
        $val = $matches[2] -replace '^"(.*)"$', '$1'  # strip surrounding quotes

        # Skip empty values
        if ($val.Trim() -eq "") { continue }

        $result = & railway variable set "$key=$val" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SET $key" -ForegroundColor Green
            $success++
        } else {
            Write-Host "  FAIL $key : $result" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host ""
Write-Host "Done. $success set, $failed failed." -ForegroundColor Cyan
