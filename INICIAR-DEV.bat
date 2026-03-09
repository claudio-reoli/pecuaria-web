@echo off
title Pecuaria - Desenvolvimento (Vite + Backend)
cd /d "%~dp0"

echo Verificando Node.js...
where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERRO: Node.js nao encontrado no PATH.
  echo Instale o Node.js de https://nodejs.org ou reinicie o Cursor apos a instalacao.
  echo.
  pause
  exit /b 1
)

echo Iniciando servidor de desenvolvimento...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
echo Aguarde o servidor iniciar, depois acesse http://localhost:5173
echo Feche esta janela para parar o servidor.
echo.

start "Abrir navegador" cmd /c "timeout /t 10 /nobreak >nul && start http://localhost:5173"
npm run dev
