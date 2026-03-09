<#
.SYNOPSIS
    Transfere dados do banco de desenvolvimento para o banco de producao.
.DESCRIPTION
    Usa pg_dump para exportar dados do ambiente de dev e psql para importar em prod.
    Requer: PostgreSQL client (pg_dump, psql) ou Docker.
.PARAMETER TruncateProd
    Se especificado, limpa as tabelas do prod antes de importar.
.PARAMETER BackupProd
    Se especificado, faz backup do prod antes de importar.
#>
param(
    [switch]$TruncateProd,
    [switch]$BackupProd,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$backendDir = Join-Path $projectRoot "backend"
$dumpFile = Join-Path $scriptDir "transferencia-pecuaria-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"

# Carrega variaveis de ambiente
function Load-Env($envFile) {
    $vars = @{}
    if (Test-Path $envFile) {
        Get-Content $envFile -Raw | ForEach-Object {
            $_ -split "`n" | ForEach-Object {
                $line = $_.Trim()
                if ($line -and -not $line.StartsWith("#")) {
                    $idx = $line.IndexOf("=")
                    if ($idx -gt 0) {
                        $key = $line.Substring(0, $idx).Trim()
                        $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
                        $vars[$key] = $val
                    }
                }
            }
        }
    }
    return $vars
}

$devEnv = Load-Env (Join-Path $backendDir ".env")
$prodEnv = Load-Env (Join-Path $backendDir ".env.production")
if (-not $prodEnv.DATABASE_URL) {
    $prodEnv = Load-Env (Join-Path $projectRoot ".env.production")
}
if (-not $prodEnv.DATABASE_URL) {
    Write-Host "Crie backend\.env.production com DATABASE_URL do ambiente de producao" -ForegroundColor Red
    exit 1
}

$devUrl = $devEnv.DATABASE_URL
$prodUrl = $prodEnv.DATABASE_URL

if (-not $devUrl) {
    Write-Host "DATABASE_URL nao encontrado em backend\.env" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Transferencia DEV -> PROD ===" -ForegroundColor Cyan
Write-Host "Origem (dev):  $($devUrl -replace ':[^:@]+@', ':****@')"
Write-Host "Destino (prod): $($prodUrl -replace ':[^:@]+@', ':****@')"
Write-Host "Arquivo dump:  $dumpFile`n"

if ($DryRun) {
    Write-Host "[Dry run] Nenhuma acao executada." -ForegroundColor Yellow
    exit 0
}

# Detecta pg_dump
$pgDump = $null
$psql = $null
if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    $pgDump = "pg_dump"
    $psql = "psql"
} elseif (Test-Path "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe") {
    $pgBin = "C:\Program Files\PostgreSQL\16\bin"
    $pgDump = Join-Path $pgBin "pg_dump.exe"
    $psql = Join-Path $pgBin "psql.exe"
} else {
    Write-Host "pg_dump nao encontrado. Use Docker ou instale PostgreSQL client." -ForegroundColor Yellow
    Write-Host "Com Docker: docker run --rm -e PGPASSWORD=... postgres:16-alpine pg_dump ..." -ForegroundColor Gray
    exit 1
}

# 1. Backup do prod (opcional)
if ($BackupProd) {
    $backupFile = Join-Path $scriptDir "backup-prod-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
    Write-Host "[1/4] Backup do ambiente de producao..." -ForegroundColor Green
    & $pgDump "--dbname=$prodUrl" "--data-only" "--no-owner" "--no-privileges" "-f" $backupFile 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host "Erro no backup prod" -ForegroundColor Red; exit 1 }
    Write-Host "       Salvo em: $backupFile`n"
} else {
    Write-Host "[1/4] Pulando backup prod (use -BackupProd para fazer backup)`n"
}

# 2. Exportar dados do dev
Write-Host "[2/4] Exportando dados do desenvolvimento..." -ForegroundColor Green
& $pgDump "--dbname=$devUrl" "--data-only" "--no-owner" "--no-privileges" "-f" $dumpFile 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "Erro ao exportar dev" -ForegroundColor Red; exit 1 }
Write-Host "       Exportado: $(Get-Item $dumpFile | Select-Object -ExpandProperty Length) bytes`n"

# 3. Truncar prod (opcional)
if ($TruncateProd) {
    Write-Host "[3/4] Limpando tabelas do ambiente de producao..." -ForegroundColor Yellow
    $truncateSql = @"
DO `$`$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END `$`$;
"@
    $truncateFile = Join-Path $env:TEMP "truncate-prod.sql"
    $truncateSql | Out-File -FilePath $truncateFile -Encoding utf8
    & $psql "--dbname=$prodUrl" "-f" $truncateFile 2>&1
    Remove-Item $truncateFile -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) { Write-Host "Erro ao truncar prod" -ForegroundColor Red; exit 1 }
    Write-Host "       Tabelas limpas.`n"
} else {
    Write-Host "[3/4] IMPORTANTE: Se prod ja tem dados, use -TruncateProd para evitar conflitos.`n" -ForegroundColor Yellow
}

# 4. Importar para prod
Write-Host "[4/4] Importando dados para producao..." -ForegroundColor Green
& $psql "--dbname=$prodUrl" "-f" $dumpFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao importar. Se houver conflitos de chave, execute com -TruncateProd." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Transferencia concluida com sucesso ===" -ForegroundColor Green
Write-Host "Arquivo dump mantido: $dumpFile"
Write-Host "Pode remover o dump manualmente apos validar.`n"
