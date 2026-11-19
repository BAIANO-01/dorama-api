@echo off
chcp 65001 > nul
title IgaraDrama — Servidor Local
cls
echo ===================================================
echo           IGARADRAMA — SISTEMA DE STREAMING
echo ===================================================
echo.
echo Iniciando o servidor backend e o aplicativo mobile...
echo.

cd /d "%~dp0"

start "IgaraDrama - Backend API (Porta 3333)" /min cmd /c "node server/index.js"
timeout /t 2 /nobreak > nul

start "IgaraDrama - Web & Mobile (Porta 5173)" /min cmd /c "npx vite --host 0.0.0.0 --port 5173"
timeout /t 2 /nobreak > nul

cls
echo ===================================================
echo         IGARADRAMA ESTA LIGADO COM SUCESSO!
echo ===================================================
echo.
echo [1] No Computador:
echo     Acesse no navegador: http://localhost:5173
echo.
echo [2] No Celular (conectado na mesma rede Wi-Fi):
echo     Acesse no navegador: http://192.168.1.8:5173
echo.
echo [3] Para Instalar o App no Celular:
echo     Acesse no celular:   http://192.168.1.8:5173/download
echo.
echo ---------------------------------------------------
echo  Mantenha esta janela aberta enquanto quiser usar
echo  o aplicativo no seu celular ou computador.
echo ---------------------------------------------------
echo.
pause
