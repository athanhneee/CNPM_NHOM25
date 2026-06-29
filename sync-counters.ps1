$login = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"identifier":"admin","password":"ptithcm2026"}'
$token = $login.access_token
Write-Host "Got token OK"
$result = Invoke-RestMethod -Uri 'http://localhost:3000/api/sections/sync-counters' -Method POST -Headers @{Authorization="Bearer $token"}
Write-Host "Result:" ($result | ConvertTo-Json)
