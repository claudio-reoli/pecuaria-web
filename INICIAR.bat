@echo off
cd /d "%~dp0"
echo Construindo frontend...
call npm run build -w frontend 2>nul
if errorlevel 1 (
  echo Erro no build. Verifique se o npm esta instalado.
  pause
  exit /b 1
)
echo Iniciando servidor...
start "Pecuaria - Backend" cmd /k "npm run dev:backend"
echo Aguardando servidor iniciar...
timeout /t 8 /nobreak >nul
echo Abrindo navegador em http://localhost:3001
start http://localhost:3001
echo Pronto. Acesse http://localhost:3001 - Login: admin@pecuaria.com / admin123
