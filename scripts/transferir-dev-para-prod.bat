@echo off
REM Transfere dados DEV -> PROD
REM Uso: transferir-dev-para-prod.bat [--truncate-prod] [--backup-prod]
cd /d "%~dp0\.."
powershell -ExecutionPolicy Bypass -File "scripts\transferir-dev-para-prod.ps1" %*
