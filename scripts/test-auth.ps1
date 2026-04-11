$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  $body = @{ username = 'admin1006'; password = '10062001' } | ConvertTo-Json
  $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/admin' -Method POST -Body $body -ContentType 'application/json' -WebSession $session -UseBasicParsing -TimeoutSec 15
  Write-Output "LOGIN_STATUS: $($r.StatusCode)"
  Write-Output "LOGIN_BODY: $($r.Content)"
  $session.Cookies.GetCookies('http://localhost:3000') | ForEach-Object { Write-Output "COOKIE_AFTER_LOGIN: $($_.Name)=$($_.Value)" }
  Start-Sleep -Seconds 1

  $r2 = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/refresh' -Method POST -WebSession $session -UseBasicParsing -TimeoutSec 15
  Write-Output "REFRESH_STATUS: $($r2.StatusCode)"
  Write-Output "REFRESH_BODY: $($r2.Content)"
  $session.Cookies.GetCookies('http://localhost:3000') | ForEach-Object { Write-Output "COOKIE_AFTER_REFRESH: $($_.Name)=$($_.Value)" }

  $csrfCookie = $session.Cookies.GetCookies('http://localhost:3000') | Where-Object { $_.Name -eq 'csrf_token' }
  if ($csrfCookie) { $csrf = $csrfCookie.Value } else { $csrf = '' }
  Write-Output "CSRF: $csrf"
  Start-Sleep -Seconds 1

  $r3 = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/logout' -Method POST -WebSession $session -UseBasicParsing -Headers @{ 'X-CSRF-Token' = $csrf } -TimeoutSec 15
  Write-Output "LOGOUT_STATUS: $($r3.StatusCode)"
  Write-Output "LOGOUT_BODY: $($r3.Content)"
  $session.Cookies.GetCookies('http://localhost:3000') | ForEach-Object { Write-Output "COOKIE_AFTER_LOGOUT: $($_.Name)=$($_.Value)" }
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
}
