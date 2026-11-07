@echo off
title HALOL NASIYA - Muddatli To'lov va Savdo Tizimi
cd /d "%~dp0"

echo ========================================================
echo    HALOL NASIYA - MUDDATLI TO'LOV VA SAVDO TIZIMI
echo ========================================================
echo.
echo Server ishga tushirilmoqda va brauzer ochilmoqda...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"

if errorlevel 1 (
    echo Mahalliy server ishga tushmadi, fayl to'g'ridan-to'g'ri brauzerda ochiladi...
    start "" "%~dp0index.html"
)

pause
