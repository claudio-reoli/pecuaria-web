@echo off
title Setup Banco - Pecuaria
cd /d "%~dp0"

echo ========================================
echo   Configuracao do Banco de Dados
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado. Execute "node -v" para verificar.
  pause
  exit /b 1
)

REM Tenta iniciar o servico PostgreSQL se estiver parado
for %%s in (postgresql-x64-16 "PostgreSQL 16") do (
  net start "%%~s" 2>nul
)

REM Verifica se PostgreSQL esta rodando e cria o banco se nao existir
set "PSQL=C:\Program Files\PostgreSQL\16\bin\psql.exe"
if exist "%PSQL%" (
  set PGPASSWORD=postgres
  "%PSQL%" -U postgres -h localhost -p 5432 -c "SELECT 1" >nul 2>&1
  if errorlevel 1 (
    echo.
    echo PostgreSQL nao esta respondendo na porta 5432.
    echo.
    echo 1. Complete a instalacao do PostgreSQL se houver janela aberta
    echo 2. Defina a senha do usuario postgres como: postgres
    echo 3. Inicie o servico: Services ^> postgresql-x64-16 ^> Iniciar
    echo    ou reinicie o computador apos a instalacao
    echo.
    echo Se usou outra senha, edite backend\.env com a senha correta.
    echo.
    pause
    exit /b 1
  )
  echo [OK] PostgreSQL conectado.
  echo Criando banco 'pecuaria' se nao existir...
  "%PSQL%" -U postgres -h localhost -p 5432 -c "CREATE DATABASE pecuaria;" 2>nul
) else (
  echo [AVISO] psql nao encontrado. Tentando Prisma mesmo assim...
)

echo.
echo Criando banco e tabelas (Prisma db push)...
cd backend
call npx prisma generate
call npx prisma db push
if errorlevel 1 (
  echo ERRO no db push. Verifique DATABASE_URL em backend\.env
  pause
  exit /b 1
)

echo.
echo Inserindo dados iniciais (seed)...
call npx tsx prisma/seed.ts
if errorlevel 1 (
  echo AVISO: Seed falhou. O sistema pode funcionar sem dados iniciais.
)

cd ..
echo.
echo ========================================
echo   Setup concluido!
echo   Login: admin@pecuaria.com / admin123
echo ========================================
pause
