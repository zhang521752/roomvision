@echo off
title CelMecha Studio - Build EXE

echo.
echo ============================================================
echo    CelMecha Studio - EXE Builder
echo ============================================================
echo.

set "BACKEND_DIR=%~dp0backend"
set "OUTPUT_DIR=%~dp0dist"

echo [1/5] Check PyInstaller...
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo [Install] Installing PyInstaller...
    pip install pyinstaller -q
)
echo [OK] PyInstaller ready

echo [2/5] Clean old files...
if exist "%BACKEND_DIR%\dist" rmdir /s /q "%BACKEND_DIR%\dist"
if exist "%BACKEND_DIR%\build" rmdir /s /q "%BACKEND_DIR%\build"
echo [OK] Clean done

echo [3/5] Install dependencies...
cd /d "%BACKEND_DIR%"
pip install -r requirements.txt -q
pip install pyinstaller -q
echo [OK] Dependencies installed

echo [4/5] Build backend...
cd /d "%BACKEND_DIR%"
pyinstaller --clean --noconfirm celmecha_studio.spec
echo [OK] Backend build done

echo [5/5] Organize output...
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

if exist "%BACKEND_DIR%\dist\CelMechaStudio" (
    xcopy /E /I /Y "%BACKEND_DIR%\dist\CelMechaStudio" "%OUTPUT_DIR%\CelMechaStudio"
)

copy /Y "%BACKEND_DIR%\data\config\api_config.json" "%OUTPUT_DIR%\CelMechaStudio\data\config\" >nul 2>&1
copy /Y "%~dp0start-backend.bat" "%OUTPUT_DIR%\" >nul 2>&1

echo.
echo ============================================================
echo    Build Complete!
echo ============================================================
echo.
echo    Output: %OUTPUT_DIR%
echo.
echo    Structure:
echo    dist/
echo    +-- CelMechaStudio/
echo    |   +-- CelMechaStudio.exe
echo    |   +-- data/
echo    |   +-- app/
echo    +-- start-backend.bat
echo.
echo    Usage:
echo    1. Copy dist folder to target computer
echo    2. Run start-backend.bat
echo    3. Or run CelMechaStudio.exe directly
echo.
pause
