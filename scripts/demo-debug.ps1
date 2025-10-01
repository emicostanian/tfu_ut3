param(
  [string]$Base = "http://localhost:8080",
  [int]$MaxRetries = 40,
  [int]$DelayMs = 500
)

$ErrorActionPreference = "Stop"

function Wait-For-Http200([string]$Url, [int]$Retries, [int]$Delay) {
  for ($i=1; $i -le $Retries; $i++) {
    try {
      $resp = Invoke-WebRequest $Url -Method GET -UseBasicParsing -TimeoutSec 2
      if ($resp.StatusCode -eq 200) {
        Write-Host "OK $($resp.StatusCode) $Url" -ForegroundColor Green
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds $Delay
    }
  }
  return $false
}

function Show-HttpErrorDetails([System.Management.Automation.ErrorRecord]$err) {
  try {
    $resp = $err.Exception.Response
    if ($resp -ne $null) {
      $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $body = $sr.ReadToEnd()
      Write-Host "Status: $($resp.StatusCode) $([int]$resp.StatusCode)" -ForegroundColor Red
      Write-Host "Body  : $body" -ForegroundColor Red
    } else {
      Write-Host "Sin Response en la excepción" -ForegroundColor Red
    }
  } catch {
    Write-Host "No se pudo leer el body del error" -ForegroundColor DarkRed
  }
}

function Save-Logs {
  $LogDir = Join-Path $PSScriptRoot 'logs'
  New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

  Write-Host "==> guardando snapshots de logs…" -ForegroundColor Cyan
  docker compose logs --no-color gateway  --since=10m | Out-File (Join-Path $LogDir 'gateway.snapshot.log')  -Encoding UTF8
  docker compose logs --no-color auth-api --since=10m | Out-File (Join-Path $LogDir 'auth-api.snapshot.log') -Encoding UTF8

  if ($script:gwJob) {
    Stop-Job $script:gwJob | Out-Null
    Receive-Job $script:gwJob | Out-Null
    Remove-Job  $script:gwJob | Out-Null
  }
  if ($script:auJob) {
    Stop-Job $script:auJob | Out-Null
    Receive-Job $script:auJob | Out-Null
    Remove-Job  $script:auJob | Out-Null
  }
  Write-Host ("Listo. Revisá la carpeta {0}" -f $LogDir) -ForegroundColor Cyan
}

function Main {
  $LogDir = Join-Path $PSScriptRoot 'logs'
  New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

  Write-Host "==> (re)build + up" -ForegroundColor Cyan
  docker compose up -d --build | Out-Null

  Write-Host "==> tails de logs (gateway y auth-api)" -ForegroundColor Cyan
  $gwLogFile = Join-Path $LogDir 'gateway.tail.log'
  $auLogFile = Join-Path $LogDir 'auth-api.tail.log'

  $script:gwJob = Start-Job -ScriptBlock {
    param($file)
    docker compose logs -f --no-color gateway 2>&1 | Tee-Object -FilePath $file
  } -ArgumentList $gwLogFile

  $script:auJob = Start-Job -ScriptBlock {
    param($file)
    docker compose logs -f --no-color auth-api 2>&1 | Tee-Object -FilePath $file
  } -ArgumentList $auLogFile

  Write-Host "==> esperando gateway $Base/health" -ForegroundColor Yellow
  if (-not (Wait-For-Http200 "$Base/health" $MaxRetries $DelayMs)) {
    Write-Host "Gateway no respondió a /health" -ForegroundColor Red
    Save-Logs
    return
  }

  $Suffix = [Guid]::NewGuid().ToString("N").Substring(0,6)
  $Email = "linus+$Suffix@example.com"
  $Pwd   = "secret"

  try {
    $null = Invoke-WebRequest "$Base/auth/diag" -UseBasicParsing -TimeoutSec 2
  } catch {
    Start-Sleep -Seconds 2
  }

  try {
    Write-Host "==> Register ($Email)" -ForegroundColor Green
    $reg = Invoke-RestMethod "$Base/auth/register" -Method POST -ContentType 'application/json' -Body (@{
      nombre = "Linus"; email = $Email; password = $Pwd } | ConvertTo-Json)
    Write-Host ("Usuario id={0}" -f $reg.id) -ForegroundColor DarkGreen
  } catch {
    Write-Host "Register lanzó error:" -ForegroundColor DarkYellow
    Show-HttpErrorDetails $_
    Write-Host "`n==> Últimos logs auth-api (3m)" -ForegroundColor Yellow
    docker compose logs --no-color auth-api --since=3m
    Write-Host "`n==> Últimos logs gateway (3m)" -ForegroundColor Yellow
    docker compose logs --no-color gateway --since=3m
    Save-Logs
    return
  }

  try {
    Write-Host "==> Login ($Email)" -ForegroundColor Green
    $login = Invoke-RestMethod "$Base/auth/login" -Method POST -ContentType 'application/json' -Body (@{
      email = $Email; password = $Pwd } | ConvertTo-Json)
    $Token = $login.token
    Write-Host ("TOKEN: {0}" -f $Token.Substring(0,[Math]::Min(16,$Token.Length))) -ForegroundColor DarkCyan
  } catch {
    Write-Host "Login lanzó error:" -ForegroundColor Red
    Show-HttpErrorDetails $_
    Write-Host "`n==> Últimos logs auth-api (3m)" -ForegroundColor Yellow
    docker compose logs --no-color auth-api --since=3m
    Write-Host "`n==> Últimos logs gateway (3m)" -ForegroundColor Yellow
    docker compose logs --no-color gateway --since=3m
    Save-Logs
    return
  }

  Write-Host "==> /auth/me" -ForegroundColor Green
  Invoke-RestMethod "$Base/auth/me" -Headers @{ Authorization = "Bearer $Token" } | ConvertTo-Json -Depth 5 | Write-Output

  Write-Host "==> Crear proyecto" -ForegroundColor Green
  $proj = Invoke-RestMethod "$Base/proyectos/" -Method POST `
    -Headers @{ Authorization = "Bearer $Token" } `
    -ContentType 'application/json' -Body '{"nombre":"Demo TFU","descripcion":"Proyecto demo"}'
  $ProjId = $proj.id
  Write-Host ("Proyecto id={0}" -f $ProjId) -ForegroundColor DarkGreen

  Write-Host "==> Crear tarea" -ForegroundColor Green
  $bodyTask = "{`"proyecto_id`":$ProjId,`"titulo`":`"Primera tarea`"}"
  $t = Invoke-RestMethod "$Base/tareas/" -Method POST -Headers @{ Authorization = "Bearer $Token" } -ContentType 'application/json' -Body $bodyTask
  $TaskId = $t.id
  Write-Host ("Tarea id={0}" -f $TaskId) -ForegroundColor DarkGreen

  Write-Host "==> Cambiar estado -> done" -ForegroundColor Green
  Invoke-RestMethod "$Base/tareas/$TaskId/estado" -Method PATCH `
    -Headers @{ Authorization = "Bearer $Token" } `
    -ContentType 'application/json' -Body '{"estado":"done"}' | Out-Null

  Write-Host "==> Listar proyectos y tareas" -ForegroundColor Green
  Invoke-RestMethod "$Base/proyectos/" -Headers @{ Authorization = "Bearer $Token" } | ConvertTo-Json -Depth 5 | Write-Output
  Invoke-RestMethod "$Base/tareas/?proyecto_id=$ProjId" -Headers @{ Authorization = "Bearer $Token" } | ConvertTo-Json -Depth 5 | Write-Output

  Write-Host "Demo OK" -ForegroundColor Green
  Save-Logs
}

Main
