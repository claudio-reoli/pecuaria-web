@echo off
title Pecuaria - PostgreSQL via Docker
cd /d "%~dp0"

echo ========================================
echo   PostgreSQL via Docker
echo ========================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo Docker nao encontrado.
  echo.
  echo 1. Instale o Docker Desktop: winget install Docker.DockerDesktop
  echo 2. Inicie o Docker Desktop e aguarde ficar pronto
  echo 3. Execute este script novamente
  echo.
  pause
  exit /b 1
)

echo Iniciando PostgreSQL...
docker compose -f docker-compose.dev.yml up -d postgres
if errorlevel 1 (
  echo ERRO ao iniciar. Verifique se o Docker Desktop esta rodando.
  pause
  exit /b 1
)

echo.
echo Aguardando PostgreSQL ficar pronto...
timeout /t 5 /nobreak >nul

echo.
echo PostgreSQL rodando em localhost:5432
echo Banco: pecuaria | Usuario: postgres | Senha: postgres
echo.
echo Agora execute SETUP-BANCO.bat para criar as tabelas.
echo Ou: npm run setup
echo.
pause
