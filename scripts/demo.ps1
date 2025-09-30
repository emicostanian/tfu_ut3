param([switch]$SetupOnly)

Write-Host "Levantando..." -ForegroundColor Cyan
docker compose up -d --build
Start-Sleep -Seconds 5
if ($SetupOnly) { exit 0 }

$Base = "http://localhost:8080"

Write-Host "==> Health" -ForegroundColor Green
Invoke-WebRequest "$Base/health" | Out-String

Write-Host "==> Register (puede fallar si ya existe)" -ForegroundColor Green
try {
  Invoke-RestMethod "$Base/auth/register" -Method POST -ContentType 'application/json' -Body '{"nombre":"Linus","email":"linus@example.com","password":"secret"}'
} catch {}

Write-Host "==> Login" -ForegroundColor Green
$login = Invoke-RestMethod "$Base/auth/login" -Method POST -ContentType 'application/json' -Body '{"email":"linus@example.com","password":"secret"}'
$TOKEN = $login.token
Write-Host "TOKEN: $TOKEN"

Write-Host "==> /auth/me" -ForegroundColor Green
Invoke-RestMethod "$Base/auth/me" -Headers @{ Authorization = "Bearer $TOKEN" }

Write-Host "==> Crear proyecto" -ForegroundColor Green
$proj = Invoke-RestMethod "$Base/proyectos/" -Method POST -Headers @{ Authorization = "Bearer $TOKEN" } -ContentType 'application/json' -Body '{"nombre":"Demo TFU","descripcion":"Proyecto demo"}'
$PID = $proj.id
Write-Host "PID: $PID"

Write-Host "==> Crear tarea" -ForegroundColor Green
$t = Invoke-RestMethod "$Base/tareas/" -Method POST -Headers @{ Authorization = "Bearer $TOKEN" } -ContentType 'application/json' -Body "{`"proyecto_id`":$PID,`"titulo`":`"Primera tarea`"}"
$TID = $t.id
Write-Host "TID: $TID"

Write-Host "==> Cambiar estado tarea -> done" -ForegroundColor Green
Invoke-RestMethod "$Base/tareas/$TID/estado" -Method PATCH -Headers @{ Authorization = "Bearer $TOKEN" } -ContentType 'application/json' -Body '{"estado":"done"}'

Write-Host "==> Listas" -ForegroundColor Green
Invoke-RestMethod "$Base/proyectos/" -Headers @{ Authorization = "Bearer $TOKEN" } | ConvertTo-Json -Depth 5
Invoke-RestMethod "$Base/tareas/?proyecto_id=$PID" -Headers @{ Authorization = "Bearer $TOKEN" } | ConvertTo-Json -Depth 5
