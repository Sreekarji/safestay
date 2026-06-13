@echo off
title SafeStay Setup
color 0B

echo.
echo   ┌─────────────────────────────────────┐
echo   │        SafeStay Setup Script         │
echo   │   Student Safety Platform            │
echo   └─────────────────────────────────────┘
echo.

:: Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo [OK] Node.js %%i
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
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Setup complete!
echo.
echo   Now run:  start.bat
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
pause
