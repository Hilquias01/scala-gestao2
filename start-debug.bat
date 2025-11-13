@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

set LOGFILE=startup_log.txt
echo ======================================================= > "%LOGFILE%"
echo Iniciando Scala Gestao em modo debug... >> "%LOGFILE%"
echo Data/Hora: %date% %time% >> "%LOGFILE%"
echo ======================================================= >> "%LOGFILE%"

set FRONTEND_PORT=5173
set BACKEND_PORT=5000
set BACKEND_DIR=backend
set FRONTEND_DIR=frontend
set LOCAL_IP=10.50.50.247

echo Verificando caminhos... >> "%LOGFILE%"
cd >nul 2>>"%LOGFILE%"

if not exist "%BACKEND_DIR%\server.js" (
  echo ❌ ERRO: Arquivo server.js não encontrado em %BACKEND_DIR%! >> "%LOGFILE%"
  echo Pressione qualquer tecla para sair...
  pause
  exit /b
)

echo Executando Backend... >> "%LOGFILE%"
cd "%BACKEND_DIR%"
set PORT=%BACKEND_PORT%
node server.js >> "%~dp0%LOGFILE%" 2>&1

cd "%~dp0%"
echo Backend finalizado. >> "%LOGFILE%"

pause
