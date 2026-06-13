@echo off
title SafeStay Setup
chcp 65001 >nul 2>&1
color 0B

echo.
echo   SafeStay Setup Script
echo   Student Safety Platform
echo.

:: Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo.
    echo   Download Node.js 20 LTS from: https://nodejs.org
    echo   Choose the "LTS" version, NOT "Current".
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER%

:: Check node version is not too new (v25+ has npm issues on Windows)
for /f "tokens=1 delims=." %%a in ("%NODE_VER:v=%") do set NODE_MAJOR=%%a
if %NODE_MAJOR% GEQ 25 (
    echo.
    echo [ERROR] Node.js v%NODE_MAJOR% is too new and npm is broken on Windows.
    echo.
    echo   Fix: Install Node.js 20 LTS from https://nodejs.org
    echo   1. Go to https://nodejs.org
    echo   2. Download the "LTS" version (20.x or 22.x)
    echo   3. Run the installer
    echo   4. Close and reopen this terminal
    echo   5. Run setup.bat again
    echo.
    pause
    exit /b 1
)

:: Check npm works
call npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is broken. Install Node.js 20 LTS from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do echo [OK] npm %%i

:: Navigate to script directory
cd /d "%~dp0"

:: Check .env
if not exist "server\.env" (
    echo.
    echo [WARN] server\.env not found.
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env" >nul
        echo [OK] Created server\.env from example
    ) else (
        echo [ERROR] No .env.example found. Create server\.env manually.
    )
)

:: Install server deps
echo.
echo [1/3] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Server npm install failed
    pause
    exit /b 1
)
echo [OK] Server deps installed

:: Install client deps
echo.
echo [2/3] Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Client npm install failed
    pause
    exit /b 1
)
echo [OK] Client deps installed

:: Seed database
echo.
echo [3/3] Seeding database...
cd ..\server
call npx tsx src/scripts/seed.ts
if %errorlevel% neq 0 (
    echo [WARN] Seed skipped - DB may already have data
)
cd ..

echo.
echo ========================================
echo   Setup complete!
echo.
echo   Now run:  start.bat
echo ========================================
echo.
pause
