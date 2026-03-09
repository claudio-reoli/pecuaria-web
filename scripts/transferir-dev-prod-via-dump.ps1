<#
.SYNOPSIS
    Gera dump do banco DEV para importar manualmente no servidor de producao.
    Use quando o PostgreSQL de prod nao for acessivel remotamente.
.DESCRIPTION
    1. Exporta dados do banco de desenvolvimento
    2. Gera instrucoes para copiar o arquivo para o servidor prod e importar
#>
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$backendDir = Join-Path $projectRoot "backend"
$dumpFile = Join-Path $scriptDir "pecuaria-dump-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"

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
$devUrl = $devEnv.DATABASE_URL
if (-not $devUrl) { Write-Host "DATABASE_URL nao encontrado em backend\.env" -ForegroundColor Red; exit 1 }

$pgDump = $null
if (Get-Command pg_dump -ErrorAction SilentlyContinue) { $pgDump = "pg_dump" }
elseif (Test-Path "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe") {
    $pgDump = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
} else {
    Write-Host "pg_dump nao encontrado." -ForegroundColor Red; exit 1
}

Write-Host "`n=== Exportando banco de desenvolvimento ===" -ForegroundColor Cyan
Write-Host "Arquivo: $dumpFile`n"
& $pgDump "--dbname=$devUrl" "--data-only" "--no-owner" "--no-privileges" "-f" $dumpFile 2>&1 | Out-Null
if (-not (Test-Path $dumpFile)) { Write-Host "Erro ao exportar." -ForegroundColor Red; exit 1 }

Write-Host "Exportado: $([math]::Round((Get-Item $dumpFile).Length/1KB, 1)) KB`n" -ForegroundColor Green
Write-Host "=== Proximos passos (no servidor de producao) ===" -ForegroundColor Cyan
Write-Host @"
1. Copie o arquivo para o servidor:
   scp "$dumpFile" usuario@34.26.233.153:/tmp/

2. No servidor (SSH), importe:
   ssh usuario@34.26.233.153

   # Truncar tabelas e importar (execute na pasta do projeto):
   psql "postgresql://postgres:postgres@localhost:5432/pecuaria" -c "
     DO \$\$ DECLARE r RECORD;
     BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public') LOOP
       EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
     END LOOP; END \$\$;"

   psql "postgresql://postgres:postgres@localhost:5432/pecuaria" -f /tmp/pecuaria-dump-*.sql

3. Ou, se usar Docker no servidor:
   docker cp "$(Split-Path -Leaf $dumpFile)" nome-container-postgres:/tmp/
   docker exec nome-container-postgres psql -U postgres -d pecuaria -f /tmp/pecuaria-dump-*.sql

Arquivo gerado: $dumpFile
"@
