@echo off
title CelMecha Studio Backend

echo.
echo ============================================================
echo    CelMecha Studio - Backend Service
echo ============================================================
echo.

set "BACKEND_DIR=%~dp0backend"

echo [Start] Backend service (port: 8000)...
echo.
echo API Docs: http://localhost:8000/docs
echo.
cd /d "%BACKEND_DIR%"
python main.py

pause
