@echo off
title Pecuaria - Setup completo via Docker
cd /d "%~dp0"

echo ========================================
echo   Setup completo: Docker + Banco
echo ========================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo Docker nao encontrado. Instale: winget install Docker.DockerDesktop
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo Node.js/npm nao encontrado. Instale o Node.js.
  pause
  exit /b 1
)

echo [1/3] Iniciando PostgreSQL via Docker...
docker compose -f docker-compose.dev.yml up -d postgres
if errorlevel 1 (
  echo ERRO: Verifique se o Docker Desktop esta rodando.
  pause
  exit /b 1
)

echo.
echo [2/3] Aguardando PostgreSQL...
timeout /t 8 /nobreak >nul

echo.
echo [3/3] Criando tabelas e dados iniciais...
cd backend
call npx prisma generate
call npx prisma db push
if errorlevel 1 (
  echo ERRO no Prisma.
  cd ..
  pause
  exit /b 1
)
call npx tsx prisma/seed.ts
cd ..

echo.
echo ========================================
echo   Pronto!
echo   Login: admin@pecuaria.com / admin123
echo   Rode: npm run dev
echo ========================================
pause
