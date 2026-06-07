@echo off
title CelMecha Studio

echo.
echo ============================================================
echo    CelMecha Studio V1.0
echo ============================================================
echo.

set "BACKEND_DIR=%~dp0backend"
set "FRONTEND_DIR=%~dp0frontend"

echo [1/4] Check Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found, please install Python 3.10+
    pause
    exit /b 1
)
echo [OK] Python installed

echo [2/4] Check Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found, please install Node.js 18+
    pause
    exit /b 1
)
echo [OK] Node.js installed

echo [3/4] Install Python dependencies...
cd /d "%BACKEND_DIR%"
pip install fastapi uvicorn pydantic aiofiles python-multipart httpx websockets aiosqlite python-dotenv loguru -q
echo [OK] Python dependencies ready

echo [4/4] Install Node.js dependencies...
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo [Install] Installing Node.js dependencies (first time may take a few minutes)...
    npm install
)
echo [OK] Node.js dependencies ready

echo.
echo ============================================================
echo    Starting services...
echo ============================================================
echo.

echo [Start] Backend (port: 8000)...
cd /d "%BACKEND_DIR%"
start "CelMecha Backend" cmd /k "python main.py"

echo [Wait] Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo [Start] Frontend (port: 3000)...
cd /d "%FRONTEND_DIR%"
start "CelMecha Frontend" cmd /k "npm run dev"

echo [Wait] Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo.
echo ============================================================
echo    Opening browser...
echo ============================================================
echo.

start http://localhost:3000

echo.
echo ============================================================
echo    Done! Browser opened.
echo ============================================================
echo.
echo    Backend API:  http://localhost:8000
echo    Frontend:     http://localhost:3000
echo    API Docs:     http://localhost:8000/docs
echo.
echo    Services are running in background.
echo    Close the backend/frontend windows to stop.
echo.
pause
